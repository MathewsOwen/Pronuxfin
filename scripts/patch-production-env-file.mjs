#!/usr/bin/env node
/**
 * Corrige `.env.production.generated` sem regenerar chaves JWT.
 * - API_URL → Render (até DNS api.* existir)
 * - DATABASE_URL do bloco Vercel → pooler Supabase :6543
 * - Adiciona vars BRAPI/mesa se ausentes
 *
 * Usage: node scripts/patch-production-env-file.mjs
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { supabaseDirectToPoolerUrl } from "./supabase-pooler-url.mjs";

const RENDER_API_DEFAULT = "https://pronuxfin.onrender.com";
const outPath = resolve(import.meta.dirname, "..", ".env.production.generated");

if (!existsSync(outPath)) {
  console.error("FAIL: .env.production.generated não encontrado. Rode: npm run production:setup");
  process.exit(1);
}

let text = readFileSync(outPath, "utf8");
const renderApi = process.env.RENDER_API_URL?.trim() || RENDER_API_DEFAULT;

// API_URL no bloco web (antes do bloco backend)
const webBlockEnd = text.indexOf("# --- Backend");
const webPart = webBlockEnd > 0 ? text.slice(0, webBlockEnd) : text;
const backendPart = webBlockEnd > 0 ? text.slice(webBlockEnd) : "";

let web = webPart;
if (/^API_URL=https:\/\/api\.pronuxfin\.com\.br/m.test(web)) {
  web = web.replace(
    /^API_URL=https:\/\/api\.pronuxfin\.com\.br/m,
    `API_URL=${renderApi}`,
  );
  web = web.replace(
    /^# Antes do DNS api\.\*: API_URL=.*$/m,
    `# Depois do DNS api.* (Parte 5): API_URL=https://api.pronuxfin.com.br`,
  );
}

// Pooler no bloco web — primeira DATABASE_URL apenas
const directMatch = web.match(/^DATABASE_URL="([^"]+)"/m);
if (directMatch) {
  const direct = directMatch[1];
  const pooler = supabaseDirectToPoolerUrl(direct);
  if (pooler && !direct.includes("pooler.supabase.com")) {
    web = web.replace(
      /^DATABASE_URL="[^"]+"/m,
      `DATABASE_URL="${pooler.replace(/"/g, '\\"')}"`,
    );
    console.log("✓ DATABASE_URL (Vercel) → pooler :6543");
  } else if (!pooler) {
    console.log("⚠ Não foi possível converter DATABASE_URL para pooler — confira manualmente no Supabase");
  }
}

const brapiExtras = [
  "BRAPI_MAX_SYMBOLS_PER_REQUEST=1",
  "BRAPI_PARALLEL_REQUESTS=3",
  "PRONUX_LIVE_DESK_BR_MAX=36",
  "AUTH_UPSTREAM_TIMEOUT_MS=55000",
  "NEXT_PUBLIC_API_WARMUP_URL=https://pronuxfin.onrender.com",
];
for (const line of brapiExtras) {
  const key = line.split("=")[0];
  if (!new RegExp(`^${key}=`, "m").test(web)) {
    const insertAfter = web.includes("BRAPI_TOKEN=")
      ? /^(BRAPI_TOKEN=.*)$/m
      : /^(FMP_API_KEY=.*)$/m;
    if (insertAfter.test(web)) {
      web = web.replace(insertAfter, `$1\n${line}`);
      console.log(`✓ Adicionado ${key}`);
    }
  }
}

text = web + backendPart;
writeFileSync(outPath, text, "utf8");

console.log(`\nFicheiro atualizado: ${outPath}`);
console.log("\nPróximo passo (só você no painel):");
console.log("  1. Vercel → Settings → Environment Variables → Production");
console.log("  2. Cole/atualize o bloco WEB (linhas 7–41) deste ficheiro");
console.log("  3. Deployments → Redeploy (Production)");
console.log(`  4. API_URL deve ser ${renderApi} até DNS api.* existir\n`);
