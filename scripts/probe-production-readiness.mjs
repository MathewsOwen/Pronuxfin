#!/usr/bin/env node
/**
 * Smoke remoto — www + API (sem segredos).
 * Usage: node scripts/probe-production-readiness.mjs
 *        API_URL=https://pronuxfin-api.onrender.com node scripts/probe-production-readiness.mjs
 */

const SITE = (process.env.PRODUCTION_PROBE_SITE ?? "https://www.pronuxfin.com.br").replace(
  /\/+$/,
  "",
);
const apiArg = process.argv.find((a) => a.startsWith("--api="))?.slice("--api=".length);
const API = (
  apiArg ??
  process.env.PRODUCTION_PROBE_API ??
  process.env.RENDER_API_URL ??
  "https://pronuxfin.onrender.com"
).replace(/\/+$/, "");

async function probe(label, url, expectOk = true) {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    let body = "";
    try {
      body = await res.text();
    } catch {
      body = "";
    }
    const pass = expectOk ? res.ok : true;
    const icon = pass ? "✓" : "✗";
    console.log(`${icon} ${label}`);
    console.log(`    ${url}`);
    console.log(`    HTTP ${res.status} (${Date.now() - started}ms)`);
    if (body && body.length < 400) {
      console.log(`    ${body.trim()}`);
    } else if (body) {
      console.log(`    ${body.trim().slice(0, 200)}…`);
    }
    return { label, pass, status: res.status };
  } catch (err) {
    console.log(`✗ ${label}`);
    console.log(`    ${url}`);
    console.log(`    ${err instanceof Error ? err.message : String(err)}`);
    return { label, pass: false, status: null };
  }
}

console.log("PRONUXFIN — probe produção\n");
console.log(`Site: ${SITE}`);
console.log(`API:  ${API}\n`);

const results = await Promise.all([
  probe("Web liveness", `${SITE}/api/health`),
  probe("Web market", `${SITE}/api/health/market`),
  probe("Web readiness", `${SITE}/api/health/ready`, true),
  probe("API liveness", `${API}/health/live`, false),
  probe("API readiness", `${API}/health/ready`, false),
]);

const failed = results.filter((r) => !r.pass);
console.log("");
if (failed.length === 0) {
  console.log("Tudo OK — login e painel privado devem funcionar.");
  process.exit(0);
}

console.log("Bloqueios prováveis:");
if (failed.some((r) => r.label.startsWith("Web readiness"))) {
  console.log("  • Vercel: DATABASE_URL, API_URL, JWT_PUBLIC_KEY + INTERNAL_API_SECRET (RS256)");
  console.log("  • API Nest ainda fora ou API_URL errado na Vercel");
}
if (failed.some((r) => r.label.startsWith("API"))) {
  console.log("  • Deploy backend (render.yaml → Render Blueprint)");
  console.log("  • DNS CNAME api → *.onrender.com (ou use RENDER_API_URL na Vercel antes do DNS)");
}
console.log("\nVer: docs/deploy-passo-a-passo.md (Partes 3–7)");
process.exit(1);
