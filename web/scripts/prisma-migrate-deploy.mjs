#!/usr/bin/env node
/**
 * Prisma migrate deploy for Vercel / CI-adjacent builds.
 * Supabase pooler (:6543) cannot run migrations — uses DIRECT_URL or derives :5432 from pooler.
 */
import { spawnSync } from "node:child_process";
import {
  isSupabasePoolerUrl,
  supabasePoolerToDirectUrl,
} from "../../scripts/supabase-pooler-url.mjs";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
let directUrl = process.env.DIRECT_URL?.trim() ?? "";

if (!databaseUrl) {
  console.error("FAIL: DATABASE_URL is required for prisma migrate deploy.");
  process.exit(1);
}

if (isSupabasePoolerUrl(databaseUrl) && !directUrl) {
  directUrl = supabasePoolerToDirectUrl(databaseUrl) ?? "";
  if (directUrl) {
    console.log(
      "Note: DIRECT_URL not set — using :5432 derived from Supabase pooler DATABASE_URL.",
    );
  }
}

if (isSupabasePoolerUrl(databaseUrl) && !directUrl) {
  console.error(
    "FAIL: DATABASE_URL uses Supabase pooler and DIRECT_URL could not be derived.",
  );
  console.error(
    "Set DIRECT_URL to the :5432 URI (Supabase → Settings → Database → Connection string → URI).",
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
