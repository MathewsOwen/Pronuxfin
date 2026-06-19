#!/usr/bin/env node
/**
 * Prisma migrate deploy — optional on Vercel (use npm run migrate:production locally).
 * Supabase: transaction pooler :6543 is runtime-only; migrate uses session pooler :5432 or DIRECT_URL.
 */
import { spawnSync } from "node:child_process";
import {
  isSupabasePoolerUrl,
  supabasePoolerToDirectUrl,
  supabasePoolerToSessionMigrateUrl,
} from "../../scripts/supabase-pooler-url.mjs";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
let directUrl = process.env.DIRECT_URL?.trim() ?? "";

if (process.env.VERCEL === "1" && process.env.PRISMA_MIGRATE_ON_BUILD !== "1") {
  console.log(
    "Skipping prisma migrate on Vercel (runtime uses pooler; run npm run migrate:production when schema changes).",
  );
  console.log("Set PRISMA_MIGRATE_ON_BUILD=1 on Vercel to run migrate during build.");
  process.exit(0);
}

if (!databaseUrl) {
  console.error("FAIL: DATABASE_URL is required for prisma migrate deploy.");
  process.exit(1);
}

if (isSupabasePoolerUrl(databaseUrl) && !directUrl) {
  directUrl =
    supabasePoolerToSessionMigrateUrl(databaseUrl) ??
    supabasePoolerToDirectUrl(databaseUrl) ??
    "";
  if (directUrl) {
    console.log(
      "Note: DIRECT_URL not set — using Supabase session pooler :5432 for migrate.",
    );
  }
}

if (isSupabasePoolerUrl(databaseUrl) && !directUrl) {
  console.error(
    "FAIL: DATABASE_URL uses Supabase pooler and no migrate URL could be derived.",
  );
  console.error(
    "Set DIRECT_URL to session pooler :5432 or run npm run migrate:production locally.",
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
