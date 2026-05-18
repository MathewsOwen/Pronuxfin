#!/usr/bin/env node
/**
 * Valida que .env.example documenta chaves obrigatórias (Fase 0/1).
 * Usage: node scripts/verify-env.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

const REQUIRED = {
  "web/.env.example": [
    "API_URL",
    "JWT_SECRET",
    "DATABASE_URL",
    "NEXT_PUBLIC_SITE_URL",
    "HEALTH_PROBE_SECRET",
    "AI_KEYS_ENCRYPTION_KEY",
    "BRAPI_TOKEN",
    "FMP_API_KEY",
    "MARKET_ALLOW_SIMULATION",
  ],
  "backend/.env.example": [
    "DATABASE_URL",
    "JWT_SECRET",
    "FRONTEND_URL",
    "FRONTEND_URLS",
    "SMTP_URL",
    "SMTP_FROM",
    "PLATFORM_ADMIN_EMAILS",
  ],
};

let failed = 0;

for (const [file, keys] of Object.entries(REQUIRED)) {
  const path = resolve(root, file);
  let content;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    console.error(`FAIL missing file: ${file}`);
    failed += 1;
    continue;
  }

  const missing = keys.filter((key) => {
    if (key === "SMTP") return !/SMTP/i.test(content);
    return !content.includes(key);
  });

  if (missing.length > 0) {
    console.error(`FAIL ${file} — missing documented keys: ${missing.join(", ")}`);
    failed += 1;
  } else {
    console.log(`OK   ${file}`);
  }
}

if (failed > 0) process.exit(1);
console.log("\nAll .env.example templates document required keys.");
