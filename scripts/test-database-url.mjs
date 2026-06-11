#!/usr/bin/env node
/**
 * Testa SELECT 1 numa DATABASE_URL via Prisma (web).
 * Usage: node scripts/test-database-url.mjs [url ou ficheiro .env]
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "../web/node_modules/@prisma/client/index.js";

const arg = process.argv[2];
let url = process.env.DATABASE_URL?.trim();

if (arg) {
  const path = resolve(process.cwd(), arg);
  if (existsSync(path)) {
    const text = readFileSync(path, "utf8");
    const webEnd = text.indexOf("# --- Backend");
    const webRaw = webEnd > 0 ? text.slice(0, webEnd) : text;
    const m = webRaw.match(/^DATABASE_URL="([^"]+)"/m) ?? webRaw.match(/^DATABASE_URL=(\S+)/m);
    url = m?.[1]?.trim();
  } else {
    url = arg.trim();
  }
}

if (!url) {
  console.error("Usage: node scripts/test-database-url.mjs <DATABASE_URL ou .env.production.generated>");
  process.exit(1);
}

process.env.DATABASE_URL = url;
const prisma = new PrismaClient();

try {
  const rows = await prisma.$queryRaw`SELECT 1 AS ok`;
  console.log("OK — banco respondeu:", rows);
  process.exit(0);
} catch (err) {
  console.error("FAIL —", err instanceof Error ? err.message : String(err));
  process.exit(1);
} finally {
  await prisma.$disconnect().catch(() => {});
}
