#!/usr/bin/env node
/**
 * Smoke HTTP — PRONUXFIN (cross-platform)
 * Usage: node scripts/smoke.mjs
 * Env: WEB_BASE, API_BASE, HEALTH_PROBE_SECRET, SMOKE_STRICT, EXPECT_PASSWORD_RESET, EXPECT_MARKET_LIVE
 */

const WEB_BASE = (process.env.WEB_BASE ?? "http://127.0.0.1:3000").replace(/\/+$/, "");
const API_BASE = (process.env.API_BASE ?? "").replace(/\/+$/, "");
const PROBE_SECRET = process.env.HEALTH_PROBE_SECRET?.trim() ?? "";
const STRICT = process.env.SMOKE_STRICT === "1" || process.env.CI === "true";
const EXPECT_SMTP_RESET = process.env.EXPECT_PASSWORD_RESET === "1";
const EXPECT_MARKET_LIVE = process.env.EXPECT_MARKET_LIVE === "1";

let failures = 0;
let warnings = 0;

function ok(msg) {
  console.log(`  OK   ${msg}`);
}

function warn(msg) {
  console.log(`  WARN ${msg}`);
  warnings += 1;
}

function fail(msg) {
  console.log(`  FAIL ${msg}`);
  failures += 1;
}

async function fetchJson(url, headers = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", ...headers },
      signal: controller.signal,
      cache: "no-store",
    });
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { status: res.status, body };
  } finally {
    clearTimeout(timer);
  }
}

function readyIsFailure(status) {
  if (status === 200) return false;
  if (status === 503 && !STRICT) return false;
  return true;
}

async function checkWebLiveness() {
  try {
    const { status, body } = await fetchJson(`${WEB_BASE}/api/health`);
    if (status === 200 && body?.status === "ok") {
      ok(`GET /api/health (${status})`);
      return;
    }
    fail(`GET /api/health (status=${status}, expected 200 + status ok)`);
  } catch (e) {
    fail(`GET /api/health (${e instanceof Error ? e.message : "error"})`);
  }
}

async function checkWebReadiness() {
  const headers = PROBE_SECRET ? { Authorization: `Bearer ${PROBE_SECRET}` } : {};
  try {
    const { status, body } = await fetchJson(`${WEB_BASE}/api/health/ready`, headers);
    if (status === 200 && body?.ok === true) {
      ok(`GET /api/health/ready (${status}, ok=true)`);
      if (PROBE_SECRET && body.checks) {
        const failed = Object.entries(body.checks).filter(
          ([k, v]) =>
            (k.endsWith("_configured") || k.endsWith("_ready")) && v === false,
        );
        if (failed.length > 0) {
          warn(`readiness checks false: ${failed.map(([k]) => k).join(", ")}`);
        }
      }
      return;
    }
    if (status === 503 && body?.ok === false) {
      const msg = `GET /api/health/ready (503) — configure API_URL, JWT_SECRET, DATABASE_URL, backend`;
      if (STRICT) fail(msg);
      else warn(msg);
      return;
    }
    if (readyIsFailure(status)) fail(`GET /api/health/ready (status=${status})`);
    else warn(`GET /api/health/ready (status=${status})`);
  } catch (e) {
    fail(`GET /api/health/ready (${e instanceof Error ? e.message : "error"})`);
  }
}

async function checkApiHealth() {
  if (!API_BASE) {
    warn("API_BASE not set — skipping backend health checks");
    return;
  }

  for (const path of ["/health/live", "/health/ready"]) {
    try {
      const { status, body } = await fetchJson(`${API_BASE}${path}`);
      if (status === 200 && body?.ok === true) ok(`GET ${path} (${status})`);
      else fail(`GET ${path} (status=${status})`);
    } catch (e) {
      fail(`GET ${path} (${e instanceof Error ? e.message : "error"})`);
    }
  }

  try {
    const { status, body } = await fetchJson(`${API_BASE}/health`);
    const mode = body?.capabilities?.password_reset_mode;
    if (status !== 200 || !mode) {
      fail(`GET /health (status=${status}, missing capabilities)`);
      return;
    }
    if (EXPECT_SMTP_RESET && mode !== "smtp") {
      fail(`GET /health password_reset_mode=${mode} (expected smtp)`);
      return;
    }
    ok(`GET /health capabilities (password_reset_mode=${mode})`);
  } catch (e) {
    fail(`GET /health (${e instanceof Error ? e.message : "error"})`);
  }
}

async function checkWebMarket() {
  try {
    const { status, body } = await fetchJson(`${WEB_BASE}/api/health/market`);
    const ready = body?.capabilities?.readyForLiveDesk === true;
    if (EXPECT_MARKET_LIVE && !ready) {
      fail(
        `GET /api/health/market (readyForLiveDesk=false, recommendations: ${(body?.capabilities?.recommendations ?? []).join("; ")})`,
      );
      return;
    }
    if (status === 200 && ready) {
      ok("GET /api/health/market (live desk ready)");
      return;
    }
    if (status === 503 && !EXPECT_MARKET_LIVE) {
      warn("GET /api/health/market (503) — configure BRAPI_TOKEN for live B3 desk");
      return;
    }
    if (EXPECT_MARKET_LIVE) {
      fail(`GET /api/health/market (status=${status})`);
    } else {
      warn(`GET /api/health/market (status=${status})`);
    }
  } catch (e) {
    fail(`GET /api/health/market (${e instanceof Error ? e.message : "error"})`);
  }
}

async function checkSitemap() {
  try {
    const res = await fetch(`${WEB_BASE}/sitemap.xml`, {
      headers: { Accept: "application/xml,text/xml" },
      cache: "no-store",
    });
    if (res.status === 200) {
      const text = await res.text();
      ok("GET /sitemap.xml (200)");
      if (!text.includes("/privacidade") || !text.includes("/termos")) {
        warn("GET /sitemap.xml — missing /privacidade or /termos");
      }
      return;
    }
    warn(`GET /sitemap.xml (status=${res.status})`);
  } catch (e) {
    warn(`GET /sitemap.xml (${e instanceof Error ? e.message : "error"})`);
  }
}

async function checkLegalPages() {
  for (const path of ["/privacidade", "/termos"]) {
    try {
      const res = await fetch(`${WEB_BASE}${path}`, {
        headers: { Accept: "text/html" },
        cache: "no-store",
        redirect: "follow",
      });
      if (res.status === 200) ok(`GET ${path} (200)`);
      else fail(`GET ${path} (status=${res.status}, expected 200)`);
    } catch (e) {
      fail(`GET ${path} (${e instanceof Error ? e.message : "error"})`);
    }
  }
}

async function checkWebQuotes() {
  if (!EXPECT_MARKET_LIVE) return;

  try {
    const { status, body } = await fetchJson(`${WEB_BASE}/api/quotes`);
    if (status === 429) {
      warn("GET /api/quotes (429 rate limited — retry smoke later)");
      return;
    }
    if (status !== 200) {
      fail(`GET /api/quotes (status=${status}, expected 200)`);
      return;
    }
    const mode = body?.dataMode;
    const simulated = body?.simulated === true || body?.cryptoSimulated === true;
    const count = (body?.results?.length ?? 0) + (body?.crypto?.length ?? 0);
    if (mode !== "live" || simulated) {
      fail(
        `GET /api/quotes (dataMode=${mode}, simulated=${simulated} — expected live desk without simulation)`,
      );
      return;
    }
    if (count < 1) {
      fail("GET /api/quotes (empty book — expected live quotes)");
      return;
    }
    ok(`GET /api/quotes (dataMode=live, ${count} quote(s))`);
  } catch (e) {
    fail(`GET /api/quotes (${e instanceof Error ? e.message : "error"})`);
  }
}

async function main() {
  console.log(
    `PRONUXFIN smoke — WEB_BASE=${WEB_BASE}${API_BASE ? `, API_BASE=${API_BASE}` : ""}${STRICT ? ", STRICT" : ""}${EXPECT_MARKET_LIVE ? ", MARKET_LIVE" : ""}`,
  );
  console.log("");

  await checkWebLiveness();
  await checkWebReadiness();
  await checkWebMarket();
  await checkWebQuotes();
  await checkSitemap();
  await checkLegalPages();
  await checkApiHealth();

  console.log("");
  if (failures > 0) {
    console.log(`Result: FAILED (${failures} failure(s), ${warnings} warning(s))`);
    process.exit(1);
  }
  if (warnings > 0) {
    console.log(`Result: PASSED WITH WARNINGS (${warnings} warning(s))`);
    process.exit(0);
  }
  console.log("Result: ALL CHECKS PASSED");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
