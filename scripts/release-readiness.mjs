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
if (process.env.RELEASE_RUN_E2E === "1") {
  steps.push(["npm", ["run", "build", "--prefix", "web"]]);
  steps.push(["npm", ["run", "test:e2e"]]);
}

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

P10 enterprise (after code deploy):
  • npm run migrate:deploy   (backend + web Prisma)
  • INTERNAL_API_SECRET identical in web + backend (>= 32 chars)
  • JWT_ALGORITHM=RS256 + JWT_PRIVATE_KEY (backend) + JWT_PUBLIC_KEY (web)
  • REFRESH_STRICT_BIND=1 on backend
  • AUTH_LOGIN_NOTIFY=1 + SMTP_URL (login alerts)
  • WEBAUTHN_RP_ID + WEBAUTHN_ORIGIN (hostname + https URL, no trailing slash)
  • Perfil: passkeys, sessões, registo de segurança — smoke manual

E2E Playwright (opt-in — define JWT_SECRET e DATABASE_URL como no CI do web):
  npm run test:e2e:install && RELEASE_RUN_E2E=1 npm run release:check

Smoke (production):
  WEB_BASE=https://www.seudominio.com.br \\
  API_BASE=https://api.seudominio.com.br \\
  EXPECT_PASSWORD_RESET=1 EXPECT_MARKET_LIVE=1 \\
  npm run smoke:strict

Docs: docs/phase-5-go-live.md · docs/deploy-passo-a-passo.md (Parte 9)
`);
