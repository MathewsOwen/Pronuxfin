#!/usr/bin/env node
/**
 * Quick CSP smoke check against a deployed/staging URL.
 *
 * Usage:
 *   CSP_CHECK_URL=https://staging.pronuxfin.com.br npm run csp:check
 *   CSP_EXPECT_MODE=report-only npm run csp:check   # default
 *   CSP_EXPECT_MODE=enforce npm run csp:check
 */

const base = process.env.CSP_CHECK_URL?.trim().replace(/\/+$/, "");
if (!base) {
  console.error("Missing CSP_CHECK_URL (e.g. https://staging.example.com)");
  process.exit(1);
}

const expectMode = (process.env.CSP_EXPECT_MODE ?? "report-only").trim().toLowerCase();
const expectHeader =
  expectMode === "enforce"
    ? "content-security-policy"
    : "content-security-policy-report-only";

const path = process.env.CSP_CHECK_PATH?.trim() || "/pt-BR";
const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

const res = await fetch(url, {
  redirect: "follow",
  headers: { Accept: "text/html" },
});

const csp =
  res.headers.get(expectHeader) ??
  res.headers.get("content-security-policy-report-only") ??
  res.headers.get("content-security-policy");

console.log(`GET ${url} → ${res.status}`);
console.log(`Expected header: ${expectHeader}`);

if (!csp) {
  console.error("FAIL: no CSP header on response.");
  console.error(
    "Hint: set CSP_MODE=report-only (or enforce) on the deployment and redeploy.",
  );
  process.exit(1);
}

const scriptSrc = csp
  .split(";")
  .map((d) => d.trim())
  .find((d) => d.toLowerCase().startsWith("script-src"));

const failures = [];

if (!scriptSrc) {
  failures.push("missing script-src directive");
} else {
  if (!/nonce-/.test(scriptSrc)) {
    failures.push("script-src has no nonce");
  }
  if (/script-src[^;]*'unsafe-inline'/i.test(csp)) {
    failures.push("script-src still contains unsafe-inline");
  }
  if (!scriptSrc.includes("'strict-dynamic'")) {
    failures.push("script-src missing strict-dynamic");
  }
}

if (!csp.includes("report-uri /api/security/csp-report")) {
  failures.push("missing report-uri /api/security/csp-report");
}

if (failures.length > 0) {
  console.error("FAIL:", failures.join("; "));
  console.error("CSP snippet:", csp.slice(0, 280) + "…");
  process.exit(1);
}

console.log("PASS: CSP header present with nonce-based script-src.");
console.log("Next: open the site → DevTools → Console; fix any CSP violations before CSP_MODE=enforce.");
