#!/usr/bin/env node
/**
 * Applies pending Prisma migrations (backend + web).
 * Requires DATABASE_URL in each project's .env (or environment).
 *
 * Usage:
 *   npm run migrate:deploy
 *   node scripts/migrate-deploy.mjs --backend-only
 *   node scripts/migrate-deploy.mjs --web-only
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backendOnly = process.argv.includes("--backend-only");
const webOnly = process.argv.includes("--web-only");

function run(label, cwd, args) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync("npx", args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`\n✗ ${label} failed (exit ${result.status ?? 1}).`);
    process.exit(result.status ?? 1);
  }
  console.log(`✓ ${label}`);
}

function warnMissingEnv(projectDir, name) {
  const envPath = path.join(projectDir, ".env");
  if (!process.env[name] && !existsSync(envPath)) {
    console.warn(
      `  ⚠ ${name} not set and ${path.relative(root, envPath)} missing — Prisma may fail.`,
    );
  }
}

console.log("PRONUXFIN — prisma migrate deploy (P10+)\n");

if (!webOnly) {
  const backendDir = path.join(root, "backend");
  warnMissingEnv(backendDir, "DATABASE_URL");
  run(
    "backend migrate deploy",
    backendDir,
    ["prisma", "migrate", "deploy"],
  );
}

if (!backendOnly) {
  const webDir = path.join(root, "web");
  warnMissingEnv(webDir, "DATABASE_URL");
  run(
    "web migrate deploy",
    webDir,
    ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"],
  );
}

console.log(`
All migrations applied.

P10 tables (backend): SecurityEvent, WebAuthnCredential, WebAuthnChallenge
P9 tables (backend): RefreshToken, User.tokenVersion
Web: AuthRateLimit

Next: configure production env (RS256, INTERNAL_API_SECRET, WEBAUTHN_*, SMTP).
See docs/deploy-passo-a-passo.md — Parte 9.
`);
