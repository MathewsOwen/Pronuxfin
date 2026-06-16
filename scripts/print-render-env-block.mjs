#!/usr/bin/env node
/** Imprime só o bloco Backend (Render) de .env.production.generated. */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve(import.meta.dirname, "..", ".env.production.generated");
if (!existsSync(path)) {
  console.error("Rode: npm run production:patch-env");
  process.exit(1);
}
const text = readFileSync(path, "utf8");
const start = text.indexOf("# --- Backend");
if (start < 0) {
  console.error("Bloco Backend não encontrado.");
  process.exit(1);
}
console.log(text.slice(start).trim());
console.log("\n# Render → serviço pronuxfin-api → Environment → Add each KEY");
console.log("# INTERNAL_API_SECRET e JWT_* devem ser IGUAIS à Vercel");
console.log("# Depois: redeploy automático; logs devem mostrar API a correr");
