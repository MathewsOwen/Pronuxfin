#!/usr/bin/env node
/**
 * Auditoria rápida das APIs públicas em produção.
 * Usage: node scripts/probe-production-apis.mjs
 */

const WEB = process.env.PROBE_WEB_URL?.trim() || "https://www.pronuxfin.com.br";
const API = process.env.PROBE_API_URL?.trim() || "https://pronuxfin.onrender.com";

const cases = [
  { name: "health", method: "GET", path: "/api/health" },
  { name: "health/ready", method: "GET", path: "/api/health/ready" },
  { name: "health/market", method: "GET", path: "/api/health/market" },
  { name: "quotes", method: "GET", path: "/api/quotes", expectMinResults: 10, expectSymbols: ["PETR4", "VALE3", "ITUB4"] },
  { name: "quotes/sector BR commodities", method: "GET", path: "/api/quotes/sector?market=br&sector=commodities", expectMinResults: 3 },
  { name: "quotes/sector US tech", method: "GET", path: "/api/quotes/sector?market=us&sector=technology", expectMinResults: 3 },
  { name: "quotes/crypto-sector", method: "GET", path: "/api/quotes/crypto-sector?sector=layer1", expectMinResults: 3 },
  { name: "quotes/lookup PETR4", method: "GET", path: "/api/quotes/lookup?symbol=PETR4" },
  { name: "quotes/lookup/batch (auth)", method: "POST", path: "/api/quotes/lookup/batch", body: { symbols: ["PETR4", "VALE3"] }, expectStatus: [401, 403] },
  { name: "market/search", method: "GET", path: "/api/market/search?q=petro" },
  { name: "news", method: "GET", path: "/api/news?limit=5" },
  { name: "market-ai (no auth)", method: "GET", path: "/api/market-ai?symbol=PETR4", expectStatus: 401 },
  { name: "user/profile PATCH (auth)", method: "PATCH", path: "/api/user/profile", body: { name: "Test" }, expectStatus: [401, 403] },
  { name: "render health/live", method: "GET", path: "/health/live", base: API },
  { name: "render health/ready", method: "GET", path: "/health/ready", base: API },
];

async function probe(c) {
  const base = c.base || WEB;
  const url = `${base}${c.path}`;
  const t0 = performance.now();
  try {
    const init = {
      method: c.method,
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(90_000),
    };
    if (c.body) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(c.body);
    }
    const res = await fetch(url, init);
    const ms = Math.round(performance.now() - t0);
    const json = await res.json().catch(() => null);
    const statuses = Array.isArray(c.expectStatus) ? c.expectStatus : c.expectStatus ? [c.expectStatus] : [200];
    const statusOk = statuses.includes(res.status);

    let detail = "";
    if (json?.results?.length != null) {
      detail = `results=${json.results.length}`;
      if (c.expectMinResults && json.results.length < c.expectMinResults) {
        detail += ` (expected ≥${c.expectMinResults})`;
      }
    } else if (json?.articles?.length != null) {
      detail = `articles=${json.articles.length}`;
    } else if (json?.ok != null) {
      detail = `ok=${json.ok}`;
    } else if (json?.degraded != null) {
      detail = `degraded=${json.degraded}`;
    }
    if (json?.warnings?.length) detail += ` warnings=${json.warnings.join(",")}`;
    if (json?.equitiesPartial) detail += " equitiesPartial";
    if (json?.partial) detail += " partial";
    if (json?.code) detail += ` code=${json.code}`;

    let symbolsOk = true;
    if (c.expectSymbols?.length && Array.isArray(json?.results)) {
      const have = new Set(json.results.map((r) => String(r.symbol ?? "").toUpperCase()));
      const missing = c.expectSymbols.filter((s) => !have.has(s.toUpperCase()));
      if (missing.length) {
        symbolsOk = false;
        detail += ` missing=${missing.join(",")}`;
      }
    }

    const dataOk =
      statusOk &&
      symbolsOk &&
      (!c.expectMinResults ||
        (json?.results?.length ?? 0) >= c.expectMinResults);

    return {
      name: c.name,
      status: res.status,
      ms,
      ok: dataOk,
      detail,
      url,
    };
  } catch (err) {
    const ms = Math.round(performance.now() - t0);
    return {
      name: c.name,
      status: 0,
      ms,
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
      url,
    };
  }
}

const results = [];
for (const c of cases) {
  const r = await probe(c);
  results.push(r);
  const icon = r.ok ? "✓" : "✗";
  console.log(`${icon} [${r.ms}ms] ${r.status} ${r.name} — ${r.detail}`);
}

const failed = results.filter((r) => !r.ok);
const slow = results.filter((r) => r.ms > 8000);
console.log("\n--- Summary ---");
console.log(`Total: ${results.length}, OK: ${results.length - failed.length}, Failed: ${failed.length}`);
if (failed.length) {
  console.log("Failed:", failed.map((r) => r.name).join(", "));
}
if (slow.length) {
  console.log("Slow (>8s):", slow.map((r) => `${r.name}(${r.ms}ms)`).join(", "));
}
const avg = Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length);
console.log(`Avg latency: ${avg}ms`);
process.exit(failed.length ? 1 : 0);
