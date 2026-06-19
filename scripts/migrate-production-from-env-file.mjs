#!/usr/bin/env node
/**
 * Applies Prisma migrations using `.env.production.generated` (never commit).
 * Usage: node scripts/migrate-production-from-env-file.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isSupabasePoolerUrl,
  supabasePoolerToSessionMigrateUrl,
} from "./supabase-pooler-url.mjs";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const envPath = resolve(root, ".env.production.generated");

function parseEnvFile(content) {
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val.replace(/\\n/g, "\n");
  }
  return env;
}

function readBlockEnv(raw, startMarker, endMarker) {
  const start = raw.indexOf(startMarker);
  if (start < 0) return {};
  const end = endMarker ? raw.indexOf(endMarker, start + startMarker.length) : raw.length;
  const slice = end > start ? raw.slice(start, end) : raw.slice(start);
  return parseEnvFile(slice);
}

if (!existsSync(envPath)) {
  console.error("FAIL: .env.production.generated não encontrado.");
  process.exit(1);
}

const raw = readFileSync(envPath, "utf8");
const webEnv = readBlockEnv(raw, "# --- Vercel", "# --- Backend");
const backendEnv = readBlockEnv(raw, "# --- Backend", null);

function run(label, cwd, env) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync("npx", ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"], {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    console.error(`\n✗ ${label} failed.`);
    process.exit(result.status ?? 1);
  }
  console.log(`✓ ${label}`);
}

const backendDb = backendEnv.DATABASE_URL?.trim();
if (!backendDb) {
  console.error("FAIL: DATABASE_URL do bloco backend ausente.");
  process.exit(1);
}

run("backend migrate deploy", resolve(root, "backend"), {
  DATABASE_URL: backendDb,
});

const webDb = webEnv.DATABASE_URL?.trim();
let webDirect = webEnv.DIRECT_URL?.trim() || backendDb;
if (isSupabasePoolerUrl(webDb) && !webEnv.DIRECT_URL?.trim()) {
  webDirect = supabasePoolerToSessionMigrateUrl(webDb) ?? backendDb;
}
if (!webDb) {
  console.error("FAIL: DATABASE_URL do bloco Vercel ausente.");
  process.exit(1);
}

run("web migrate deploy", resolve(root, "web"), {
  DATABASE_URL: webDb,
  DIRECT_URL: webDirect,
});

console.log("\nMigrações aplicadas no Postgres de produção.\n");
