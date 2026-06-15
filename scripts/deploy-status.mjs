#!/usr/bin/env node
/**
 * Checklist interativo do deploy — imprime estado remoto + próximos passos.
 * Usage: npm run deploy:status
 */

const SITE = "https://www.pronuxfin.com.br";
const API = process.env.RENDER_API_URL?.trim() || "https://pronuxfin.onrender.com";

async function probe(url, label, expectOk = true) {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(20_000),
    });
    let json = null;
    try {
      json = await res.json();
    } catch {
      /* ignore */
    }
    const pass = expectOk ? res.ok : true;
    return { label, pass, status: res.status, json, url };
  } catch (err) {
    return {
      label,
      pass: false,
      status: null,
      error: err instanceof Error ? err.message : String(err),
      url,
    };
  }
}

console.log("PRONUXFIN — estado do deploy\n");
console.log(`Site: ${SITE}`);
console.log(`API:  ${API}\n`);

const [webReady, apiReady, quotes] = await Promise.all([
  probe(`${SITE}/api/health/ready`, "Web readiness"),
  probe(`${API}/health/ready`, "API readiness", false),
  probe(`${SITE}/api/quotes`, "Quotes", false),
]);

function line(r) {
  const icon = r.pass ? "✓" : "✗";
  console.log(`${icon} ${r.label} — HTTP ${r.status ?? "ERR"}`);
  if (r.json?.failed_checks?.length) {
    console.log(`    failed_checks: ${r.json.failed_checks.join(", ")}`);
  }
  if (r.error) console.log(`    ${r.error}`);
}

line(webReady);
line(apiReady);

if (quotes.json?.results) {
  const n = Array.isArray(quotes.json.results) ? quotes.json.results.length : 0;
  const crypto = Array.isArray(quotes.json.crypto) ? quotes.json.crypto.length : 0;
  console.log(`○ Quotes — BR: ${n} ações, crypto: ${crypto}`);
}

console.log("\n--- Onde estamos no guia ---\n");

const part4Done = webReady.pass;
const part6Done = true; // www resolves to Vercel
const part7Done = false; // api.pronuxfin.com.br DNS

console.log(`Parte 4 (Vercel env + ready):  ${part4Done ? "FEITA" : "PENDENTE ← você está aqui"}`);
console.log(`Parte 5 (CORS / login):         ${part4Done ? "testar login" : "depois do ready"}`);
console.log(`Parte 6 (www no domínio):       FEITA (${SITE})`);
console.log(`Parte 7 (DNS api.*):            PENDENTE (use ${API} na Vercel por agora)`);
console.log(`Parte 8 (smoke final):          ${part4Done ? "rodar npm run production:probe" : "depois do ready"}`);

if (!part4Done) {
  console.log("\n--- Ação agora (Vercel, ~10 min) ---\n");
  console.log("1. npm run production:print-vercel");
  console.log("2. Vercel → Settings → Environment Variables → Production");
  console.log("3. Confirme API_URL=" + API);
  console.log("4. DATABASE_URL = pooler :6543 (npm run production:test-db valida local)");
  console.log("5. JWT_PUBLIC_KEY + INTERNAL_API_SECRET iguais ao .env.production.generated");
  console.log("6. Deployments → Redeploy (Production)");
  console.log("7. curl " + SITE + "/api/health/ready → ok:true\n");
}

process.exit(part4Done ? 0 : 1);
