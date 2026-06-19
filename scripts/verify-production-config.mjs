#!/usr/bin/env node
/**
 * Valida variáveis de produção antes do go-live (espelha production-security + readiness crítico).
 * Usage:
 *   node scripts/verify-production-config.mjs .env.production.generated
 *   node scripts/verify-production-config.mjs   (usa process.env)
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const envPath = args[0] ? resolve(process.cwd(), args[0]) : null;

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

function loadEnv() {
  if (envPath) {
    if (!existsSync(envPath)) {
      console.error(`FAIL: ficheiro não encontrado: ${envPath}`);
      process.exit(1);
    }
    return parseEnvFile(readFileSync(envPath, "utf8"));
  }
  return process.env;
}

function get(env, name) {
  return (env[name] ?? "").trim();
}

function isTruthy(env, name) {
  const v = get(env, name).toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function isManualPlaceholder(value) {
  return !value || value.includes("<<< MANUAL");
}

function hasMarketAi(env) {
  return (
    !!get(env, "OPENAI_API_KEY") ||
    !!get(env, "GEMINI_API_KEY") ||
    !!get(env, "GOOGLE_GENERATIVE_AI_API_KEY") ||
    !!get(env, "PRONUX_MARKET_AI_OLLAMA_ORIGIN")
  );
}

const env = loadEnv();
const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

// --- Web (Vercel) — bloqueia deploy / manutenção ---
if (isManualPlaceholder(get(env, "API_URL"))) fail("API_URL ausente ou placeholder");
if (isManualPlaceholder(get(env, "DATABASE_URL"))) fail("DATABASE_URL ausente ou placeholder");

const apiUrl = get(env, "API_URL");
if (apiUrl.includes("api.pronuxfin.com.br")) {
  warn(
    "API_URL aponta para api.pronuxfin.com.br — só use depois do DNS (Parte 5); até lá use https://pronuxfin.onrender.com",
  );
}

// Só o primeiro DATABASE_URL do ficheiro = bloco Vercel (parseEnvFile sobrescreve; re-leia ordem)
if (envPath && existsSync(envPath)) {
  const raw = readFileSync(envPath, "utf8");
  const webEnd = raw.indexOf("# --- Backend");
  const webRaw = webEnd > 0 ? raw.slice(0, webEnd) : raw;
  const webDb = webRaw.match(/^DATABASE_URL=(?:"([^"]+)"|(\S+))/m);
  const webDbUrl = (webDb?.[1] ?? webDb?.[2] ?? "").trim();
  if (
    webDbUrl &&
    (webDbUrl.includes("supabase.co:5432") ||
      (webDbUrl.includes(":5432/") && !webDbUrl.includes("pgbouncer")))
  ) {
    warn(
      "DATABASE_URL (bloco Vercel) parece :5432 direct — use pooler :6543?pgbouncer=true",
    );
  }
  if (
    webDbUrl &&
    (webDbUrl.includes("pooler.supabase.com") || webDbUrl.includes("pgbouncer=true"))
  ) {
    const directUrl = get(env, "DIRECT_URL");
    if (!directUrl || isManualPlaceholder(directUrl)) {
      fail(
        "DIRECT_URL obrigatório na Vercel quando DATABASE_URL usa pooler Supabase (migrate no build)",
      );
    }
  }
}

const siteUrl = get(env, "NEXT_PUBLIC_SITE_URL");
const vercelUrl = get(env, "VERCEL_URL") || get(env, "VERCEL_PROJECT_PRODUCTION_URL");
if (!siteUrl && !vercelUrl) {
  fail("NEXT_PUBLIC_SITE_URL ausente (ou deploy Vercel sem VERCEL_URL)");
}

if (get(env, "JWT_ALGORITHM").toUpperCase() !== "RS256") {
  fail("JWT_ALGORITHM deve ser RS256 em produção");
}

const pubKey = get(env, "JWT_PUBLIC_KEY");
if (!pubKey.includes("BEGIN PUBLIC KEY")) {
  fail("JWT_PUBLIC_KEY inválida ou ausente");
}

if (!isTruthy(env, "INTERNAL_API_REQUEST_SIGNING")) {
  fail("INTERNAL_API_REQUEST_SIGNING=1 obrigatório no web");
}

if (get(env, "INTERNAL_API_SECRET").length < 32) {
  fail("INTERNAL_API_SECRET ausente ou < 32 caracteres");
}

if (get(env, "NEXT_PUBLIC_MARKET_ALLOW_SIMULATION") === "1") {
  fail("NEXT_PUBLIC_MARKET_ALLOW_SIMULATION=1 proibido em produção");
}

const healthProbe = get(env, "HEALTH_PROBE_SECRET");
if (healthProbe.length < 32) {
  fail("HEALTH_PROBE_SECRET ausente ou < 32 caracteres");
}

if (!isTruthy(env, "COOKIE_SAMESITE_STRICT")) {
  fail("COOKIE_SAMESITE_STRICT=1 obrigatório");
}

if (get(env, "CSRF_ENFORCE") === "0") fail("CSRF_ENFORCE=0 proibido em produção");
if (get(env, "AUTH_SESSION_VERSION_CHECK") === "0") {
  fail("AUTH_SESSION_VERSION_CHECK=0 proibido em produção");
}
if (get(env, "MAINTENANCE_FORCE_OFF") === "1") {
  fail("MAINTENANCE_FORCE_OFF=1 proibido em produção");
}
if (get(env, "MARKET_ALLOW_SIMULATION") === "1") {
  fail("MARKET_ALLOW_SIMULATION=1 proibido em produção");
}

const csp = get(env, "CSP_MODE") || "enforce";
if (csp === "off") fail("CSP_MODE=off proibido em produção");

const aiKey = get(env, "AI_KEYS_ENCRYPTION_KEY");
if (!/^[0-9a-fA-F]{64}$/.test(aiKey)) {
  fail("AI_KEYS_ENCRYPTION_KEY deve ter 64 caracteres hex");
}

const rpId = get(env, "WEBAUTHN_RP_ID");
const webauthnOrigin = get(env, "WEBAUTHN_ORIGIN");
if (
  !rpId ||
  !webauthnOrigin ||
  !webauthnOrigin.startsWith("https://") ||
  webauthnOrigin.endsWith("/")
) {
  fail("WEBAUTHN_RP_ID + WEBAUTHN_ORIGIN (https, sem barra final) obrigatórios");
}

if (!hasMarketAi(env) || isManualPlaceholder(get(env, "OPENAI_API_KEY"))) {
  if (
    isManualPlaceholder(get(env, "OPENAI_API_KEY")) &&
    isManualPlaceholder(get(env, "GEMINI_API_KEY")) &&
    isManualPlaceholder(get(env, "GOOGLE_GENERATIVE_AI_API_KEY")) &&
    isManualPlaceholder(get(env, "PRONUX_MARKET_AI_OLLAMA_ORIGIN"))
  ) {
    fail("Pelo menos um motor de IA: OPENAI_API_KEY, GEMINI_API_KEY ou PRONUX_MARKET_AI_OLLAMA_ORIGIN");
  }
}

// --- Backend (se presente no ficheiro) ---
const privKey = get(env, "JWT_PRIVATE_KEY");
if (privKey && !privKey.includes("BEGIN PRIVATE KEY")) {
  fail("JWT_PRIVATE_KEY inválida no bloco backend");
}

if (get(env, "REFRESH_STRICT_BIND") && !isTruthy(env, "REFRESH_STRICT_BIND")) {
  fail("REFRESH_STRICT_BIND=1 obrigatório no backend em produção");
}

if (isManualPlaceholder(get(env, "SMTP_URL"))) {
  warn("SMTP_URL ausente — recuperação de senha não enviará e-mail real");
}

if (isManualPlaceholder(get(env, "BRAPI_TOKEN"))) {
  warn("BRAPI_TOKEN ausente — cotações B3 podem ficar limitadas");
}

if (isManualPlaceholder(get(env, "FMP_API_KEY")) && isManualPlaceholder(get(env, "FINANCIAL_MODELING_PREP_API_KEY"))) {
  warn("FMP_API_KEY ausente — dossiê internacional incompleto");
}

console.log("PRONUXFIN — verificação de produção\n");
if (envPath) console.log(`Ficheiro: ${envPath}\n`);

if (warnings.length > 0) {
  console.log("Avisos (não bloqueiam manutenção, mas afetam qualidade):");
  for (const w of warnings) console.log(`  ⚠ ${w}`);
  console.log("");
}

if (errors.length > 0) {
  console.log("Erros (causam manutenção ou crash em produção):");
  for (const e of errors) console.log(`  ✗ ${e}`);
  console.log("\nCorrija os erros acima antes do deploy.\n");
  process.exit(1);
}

console.log("OK — configuração web pronta para go-live (sem tela de manutenção).\n");
if (warnings.length > 0) {
  console.log("Resolva os avisos para experiência 10/10 (mercado + e-mail).\n");
}
