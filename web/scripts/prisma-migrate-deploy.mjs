#!/usr/bin/env node
/**
 * Prisma migrate deploy for Vercel / CI-adjacent builds.
 * Supabase pooler (:6543) cannot run migrations — requires DIRECT_URL (:5432).
 */
import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
const directUrl = process.env.DIRECT_URL?.trim() ?? "";

function isSupabasePooler(url) {
  return /pooler\.supabase\.com:6543/i.test(url) || /[?&]pgbouncer=true/i.test(url);
}

if (!databaseUrl) {
  console.error("FAIL: DATABASE_URL is required for prisma migrate deploy.");
  process.exit(1);
}

if (isSupabasePooler(databaseUrl) && !directUrl) {
  console.error(
    "FAIL: DATABASE_URL uses Supabase pooler — set DIRECT_URL to the :5432 connection (Supabase → Settings → Database → URI direct).",
  );
  process.exit(1);
}

const migrateEnv = {
  ...process.env,
  DIRECT_URL: directUrl || databaseUrl,
};

const result = spawnSync(
  "npx",
  ["prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: migrateEnv,
  },
);

process.exit(result.status ?? 1);
