#!/usr/bin/env node
/**
 * Verificação completa do deploy — health, mercado, auth e DNS.
 * Usage: npm run deploy:finish
 */

const SITE = (process.env.WEB_BASE ?? process.env.SITE ?? "https://www.pronuxfin.com.br").replace(
  /\/+$/,
  "",
);
const API = (
  process.env.API_BASE ??
  process.env.RENDER_API_URL ??
  "https://pronuxfin.onrender.com"
).replace(/\/+$/, "");
const APEX = process.env.APEX_HOST ?? "https://pronuxfin.com.br";

const checks = [];
let manualActions = [];

function record(id, label, pass, detail = "", manual = null) {
  checks.push({ id, label, pass, detail });
  if (!pass && manual) manualActions.push(manual);
}

async function fetchJson(url, init = {}) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(init.timeoutMs ?? 70_000),
    ...init,
  });
  let body = null;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 200) };
  }
  return { status: res.status, body, ok: res.ok };
}

async function probeHealth() {
  const web = await fetchJson(`${SITE}/api/health/ready`);
  record(
    "web_ready",
    "Web readiness (/api/health/ready)",
    web.ok && web.body?.ok === true,
    `HTTP ${web.status}`,
    "Vercel → confira DATABASE_URL (pooler :6543), API_URL, JWT_PUBLIC_KEY, INTERNAL_API_SECRET → Redeploy",
  );

  const api = await fetchJson(`${API}/health/ready`, { timeoutMs: 25_000 });
  record(
    "api_ready",
    "API readiness (/health/ready)",
    api.ok && api.body?.ok === true,
    `HTTP ${api.status}`,
    "Render → DATABASE_URL direct :5432, JWT RS256, INTERNAL_API_SECRET → Manual Deploy",
  );

  const apiHealth = await fetchJson(`${API}/health`, { timeoutMs: 25_000 });
  // Em produção /health omite capabilities — SMTP é validado em probeAuth().
  const resetMode = apiHealth.body?.capabilities?.password_reset_mode;
  if (resetMode) {
    record(
      "smtp",
      "Recuperação de senha (SMTP no Render)",
      resetMode === "smtp",
      `password_reset_mode=${resetMode}`,
      "Render → cole SMTP_URL + SMTP_FROM do bloco BACKEND → redeploy",
    );
  }
}

async function probeMarket() {
  const market = await fetchJson(`${SITE}/api/health/market`, { timeoutMs: 30_000 });
  const ready =
    market.body?.capabilities?.readyForLiveDesk === true || market.body?.ok === true;
  record(
    "market",
    "Mesa ao vivo (/api/health/market)",
    market.ok && ready,
    ready ? "readyForLiveDesk=true" : `HTTP ${market.status}`,
    "Vercel → BRAPI_TOKEN + FMP_API_KEY → Redeploy",
  );

  const quotes = await fetchJson(`${SITE}/api/quotes`, { timeoutMs: 45_000 });
  const br = Array.isArray(quotes.body?.results) ? quotes.body.results.length : 0;
  const crypto = Array.isArray(quotes.body?.crypto) ? quotes.body.crypto.length : 0;
  record(
    "quotes",
    "Cotações ao vivo (/api/quotes)",
    quotes.ok && br + crypto > 0,
    `BR: ${br}, crypto: ${crypto}`,
    "Confira BRAPI_TOKEN na Vercel e limites BRAPI_MAX_SYMBOLS_PER_REQUEST",
  );
}

async function postAuth(path, body) {
  return fetchJson(`${SITE}${path}`, {
    method: "POST",
    timeoutMs: 90_000,
    headers: {
      "Content-Type": "application/json",
      Origin: SITE,
      Referer: `${SITE}/pt-BR/register`,
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "cors",
    },
    body: JSON.stringify(body),
  });
}

async function probeAuth() {
  const password = `Probe-${Date.now()}!Fin12`;
  const email = `deploy-finish-${Date.now()}@example.com`;

  const badRegister = await postAuth("/api/auth/register", {
    email,
    password,
    name: "Deploy Finish Probe",
  });
  record(
    "register_validation",
    "Registo valida acceptTerms",
    badRegister.status === 400,
    `sem acceptTerms → HTTP ${badRegister.status}`,
  );

  const register = await postAuth("/api/auth/register", {
    email,
    password,
    name: "Deploy Finish Probe",
    acceptTerms: true,
  });
  const registerOk = register.status === 200 && register.body?.ok === true;
  record(
    "register",
    "Registo com acceptTerms",
    registerOk,
    `HTTP ${register.status}`,
    "Render Starter + INTERNAL_API_SECRET igual Vercel/Render + AUTH_UPSTREAM_TIMEOUT_MS=55000 na Vercel",
  );

  if (registerOk) {
    const login = await postAuth("/api/auth/login", { email, password });
    const loginOk = login.status === 200 && (login.body?.ok === true || login.body?.user);
    record(
      "login",
      "Login após registo",
      loginOk,
      `HTTP ${login.status}`,
      "Confira FRONTEND_URL=https://www.pronuxfin.com.br no Render",
    );
  } else {
    record("login", "Login após registo", false, "pulado — registo falhou");
  }

  const forgot = await postAuth("/api/auth/forgot-password", {
    email: "matheusdiniziphone@gmail.com",
    locale: "pt-BR",
  });
  const forgotOk = forgot.status === 200 && forgot.body?.ok === true;
  record(
    "forgot_password",
    "Esqueci a senha (e-mail)",
    forgotOk,
    `HTTP ${forgot.status}${forgot.body?.code ? ` (${forgot.body.code})` : ""}`,
    forgot.status === 504
      ? "Vercel → AUTH_UPSTREAM_TIMEOUT_MS=55000; Render → SMTP_URL + bloco BACKEND completo; confirme plano Starter"
      : forgot.body?.code === "AUTH_PASSWORD_RESET_UNAVAILABLE"
        ? "Render → SMTP_URL + SMTP_FROM no painel → redeploy"
        : "Render → SMTP_URL + SMTP_FROM no painel",
  );

  if (!checks.some((c) => c.id === "smtp")) {
    record(
      "smtp",
      "Recuperação de senha (SMTP no Render)",
      forgotOk,
      forgotOk ? "forgot-password OK" : `inferido de forgot-password`,
      "Render → npm run production:print-render → colar no painel → redeploy",
    );
  }
}

async function probeDns() {
  try {
    const res = await fetch(APEX.replace(/\/+$/, ""), {
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
    });
    const ok = res.status >= 300 && res.status < 400;
    record(
      "apex",
      `Domínio apex (${APEX.replace(/^https?:\/\//, "")})`,
      ok,
      `HTTP ${res.status}`,
      "Vercel → Domains → adicionar pronuxfin.com.br → redirect para www",
    );
  } catch (err) {
    record(
      "apex",
      `Domínio apex (${APEX.replace(/^https?:\/\//, "")})`,
      false,
      err instanceof Error ? err.message : String(err),
      "Registro.br → CNAME/A conforme Vercel para pronuxfin.com.br",
    );
  }

  try {
    const res = await fetch(`${SITE}/sitemap.xml`, {
      signal: AbortSignal.timeout(15_000),
      headers: { Accept: "application/xml,text/xml" },
    });
    record("sitemap", "Sitemap público", res.ok, `HTTP ${res.status}`);
  } catch (err) {
    record(
      "sitemap",
      "Sitemap público",
      false,
      err instanceof Error ? err.message : String(err),
    );
  }
}

function printReport() {
  const passed = checks.filter((c) => c.pass).length;
  const total = checks.length;
  const pct = Math.round((passed / total) * 100);

  console.log("PRONUXFIN — verificação de deploy 100%\n");
  console.log(`Site: ${SITE}`);
  console.log(`API:  ${API}\n`);

  for (const c of checks) {
    console.log(`${c.pass ? "✓" : "✗"} ${c.label}`);
    if (c.detail) console.log(`    ${c.detail}`);
  }

  console.log(`\n--- Progresso: ${passed}/${total} (${pct}%) ---\n`);

  const guide = [
    { key: "part4", label: "Parte 4 — Vercel env + ready", done: checks.find((c) => c.id === "web_ready")?.pass },
    { key: "part3", label: "Parte 3 — API Render + DB", done: checks.find((c) => c.id === "api_ready")?.pass },
    { key: "part5", label: "Parte 5 — Registo + login", done: checks.find((c) => c.id === "login")?.pass },
    { key: "part6", label: "Parte 6 — www no domínio", done: true },
    { key: "part6b", label: "Parte 6b — apex → www", done: checks.find((c) => c.id === "apex")?.pass },
    { key: "part7", label: "Parte 7 — DNS api.* (opcional)", done: false },
    { key: "part8", label: "Parte 8 — SMTP + smoke", done: checks.find((c) => c.id === "forgot_password")?.pass },
  ];

  for (const g of guide) {
    const icon = g.done ? "✓" : g.key === "part7" ? "○" : "✗";
    const suffix = g.key === "part7" ? " (use Render URL na Vercel por agora)" : "";
    console.log(`${icon} ${g.label}${suffix}`);
  }

  if (manualActions.length > 0) {
    console.log("\n--- Ações manuais (só você no painel) ---\n");
    [...new Set(manualActions)].forEach((a, i) => console.log(`${i + 1}. ${a}`));
    console.log("\nComandos úteis:");
    console.log("  npm run production:print-vercel   → colar na Vercel");
    console.log("  npm run production:print-render   → colar no Render");
    console.log("  npm run production:patch-env      → corrige pooler + timeouts local");
  }

  if (passed === total) {
    console.log("\nDeploy 100% — pode anunciar o beta público.");
    process.exit(0);
  }

  console.log(`\nFaltam ${total - passed} verificação(ões) para deploy 100%.`);
  process.exit(1);
}

await probeHealth();
await probeMarket();
await probeAuth();
await probeDns();
printReport();
