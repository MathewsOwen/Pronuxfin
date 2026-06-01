#!/usr/bin/env node
/**
 * Vercel + Next.js 16 + Root Directory `web`: o finalizador procura
 * `.next` na raiz do repo (`/vercel/path0/.next`), mas o build gera em `web/.next`.
 * Copia o output e garante routes-manifest-deterministic.json.
 */
import { copyFileSync, cpSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

if (process.env.VERCEL !== "1") {
  process.exit(0);
}

const webDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcNext = join(webDir, ".next");
const destNext = join(webDir, "..", ".next");

if (!existsSync(srcNext)) {
  console.warn("[vercel-sync-next-output] .next ausente — nada a sincronizar.");
  process.exit(0);
}

function ensureDeterministicManifest(nextDir) {
  const routes = join(nextDir, "routes-manifest.json");
  const deterministic = join(nextDir, "routes-manifest-deterministic.json");
  if (existsSync(routes) && !existsSync(deterministic)) {
    copyFileSync(routes, deterministic);
  }
}

ensureDeterministicManifest(srcNext);

console.log(`[vercel-sync-next-output] ${srcNext} → ${destNext}`);
cpSync(srcNext, destNext, { recursive: true, force: true });
ensureDeterministicManifest(destNext);

console.log("[vercel-sync-next-output] ok");
