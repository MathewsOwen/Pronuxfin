#!/usr/bin/env node
/**
 * Workaround: Vercel + Next.js 16 + Root Directory `web`.
 * O finalizador Git procura artefactos em `/vercel/path0/` (raiz do repo),
 * mas install/build correm em `web/`. Cria symlinks na raiz do clone.
 *
 * @see https://github.com/vercel/vercel/issues/15937
 */
import { copyFileSync, existsSync, lstatSync, symlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

if (process.env.VERCEL !== "1") {
  process.exit(0);
}

const webDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(webDir, "..");
const nextDir = join(webDir, ".next");

function ensureDeterministicManifest(dir) {
  const routes = join(dir, "routes-manifest.json");
  const deterministic = join(dir, "routes-manifest-deterministic.json");
  if (existsSync(routes) && !existsSync(deterministic)) {
    copyFileSync(routes, deterministic);
  }
}

function ensureRelativeSymlink(relativeTarget, linkPath, label) {
  if (existsSync(linkPath)) {
    try {
      if (lstatSync(linkPath).isSymbolicLink()) {
        console.log(`[vercel-monorepo-fix] ${label}: symlink já existe`);
        return;
      }
      console.warn(`[vercel-monorepo-fix] ${label}: ${linkPath} existe (não é symlink), ignorando`);
      return;
    } catch {
      return;
    }
  }

  symlinkSync(relativeTarget, linkPath, "dir");
  console.log(`[vercel-monorepo-fix] ${label}: ${linkPath} → ${relativeTarget}`);
}

if (!existsSync(nextDir)) {
  console.warn("[vercel-monorepo-fix] web/.next ausente — build incompleto?");
  process.exit(1);
}

ensureDeterministicManifest(nextDir);

ensureRelativeSymlink("web/node_modules", join(repoRoot, "node_modules"), "node_modules");
ensureRelativeSymlink("web/.next", join(repoRoot, ".next"), ".next");

console.log("[vercel-monorepo-fix] ok");
