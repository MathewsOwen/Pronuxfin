#!/usr/bin/env node
/**
 * Resumo rápido do deploy — para verificação completa use: npm run deploy:finish
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

console.log("\nVerificação completa: npm run deploy:finish\n");

const part4Done = webReady.pass;
console.log(`Parte 4 (Vercel env + ready):  ${part4Done ? "FEITA" : "PENDENTE"}`);
console.log(`Parte 5 (CORS / login):         rode deploy:finish`);
console.log(`Parte 6 (www no domínio):       FEITA (${SITE})`);
console.log(`Parte 7 (DNS api.*):            OPCIONAL (${API})`);
console.log(`Parte 8 (SMTP + smoke):         rode deploy:finish`);

if (!part4Done) {
  console.log("\n--- Ação rápida ---\n");
  console.log("1. npm run production:print-vercel");
  console.log("2. Vercel → Environment Variables → Production → Redeploy");
  console.log("3. npm run deploy:finish\n");
}

process.exit(part4Done ? 0 : 1);
