#!/usr/bin/env node
/** Imprime só o bloco Vercel de .env.production.generated para colar no painel. */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve(import.meta.dirname, "..", ".env.production.generated");
if (!existsSync(path)) {
  console.error("Rode: npm run production:patch-env");
  process.exit(1);
}
const text = readFileSync(path, "utf8");
const start = text.indexOf("# --- Vercel");
const end = text.indexOf("# --- Backend");
if (start < 0 || end < 0) {
  console.error("Bloco Vercel não encontrado no ficheiro.");
  process.exit(1);
}
console.log(text.slice(start, end).trim());
console.log("\n# Cole cada linha KEY=valor em Vercel → Settings → Environment Variables → Production");
console.log("# Depois: Deployments → ⋮ → Redeploy");
