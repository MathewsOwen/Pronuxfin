#!/usr/bin/env node
/**
 * Release readiness — Fase 5
 * Runs repo validation and prints go-live reminders.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  return result.status === 0;
}

console.log("PRONUXFIN — release readiness (Fase 5)\n");

const steps = [
  ["node", ["scripts/verify-env.mjs"]],
  ["npm", ["run", "validate"]],
];

for (const [cmd, args] of steps) {
  if (!run(cmd, args)) {
    console.error("\nRelease check FAILED. Fix issues above before go-live.\n");
    process.exit(1);
  }
}

console.log(`
Release check PASSED (repo).

Before public go-live, confirm in production:
  • NEXT_PUBLIC_SITE_URL, API_URL, JWT_SECRET (web + API match)
  • DATABASE_URL, BRAPI_TOKEN, FMP_API_KEY
  • SMTP for password reset on backend
  • /privacidade and /termos reachable
  • Register requires terms acceptance

Smoke (production):
  WEB_BASE=https://www.seudominio.com.br \\
  API_BASE=https://api.seudominio.com.br \\
  EXPECT_PASSWORD_RESET=1 EXPECT_MARKET_LIVE=1 \\
  npm run smoke:strict

Docs: docs/phase-5-go-live.md
`);
