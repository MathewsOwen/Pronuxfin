#!/usr/bin/env node
/**
 * Gera segredos + ficheiro `.env.production.generated` para go-live pronuxfin.com.br.
 * Usage: node scripts/setup-pronuxfin-production.mjs
 *
 * NUNCA commite `.env.production.generated` — já está coberto por `.env.*` no .gitignore.
 */

import { generateKeyPairSync, randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { supabaseDirectToPoolerUrl } from "./supabase-pooler-url.mjs";

function readEnvValue(filePath, key) {
  if (!existsSync(filePath)) return null;
  const text = readFileSync(filePath, "utf8");
  const re = new RegExp(`^${key}=(.*)$`, "m");
  const match = text.match(re);
  if (!match) return null;
  let value = match[1].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return value.length > 0 ? value : null;
}

const SITE = "https://www.pronuxfin.com.br";
const RP_ID = "www.pronuxfin.com.br";
const API_URL_AFTER_DNS = "https://api.pronuxfin.com.br";
const RENDER_API_DEFAULT = "https://pronuxfin.onrender.com";

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 4096,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const internalSecret = randomBytes(32).toString("base64url");
const aiKeysEncryptionKey = randomBytes(32).toString("hex");
const healthProbeSecret = randomBytes(32).toString("base64url");

const pubOneLine = publicKey.trim().replace(/\n/g, "\\n");
const privOneLine = privateKey.trim().replace(/\n/g, "\\n");

const root = resolve(import.meta.dirname, "..");
const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  readEnvValue(resolve(root, "backend", ".env"), "DATABASE_URL") ||
  readEnvValue(resolve(root, "web", ".env"), "DATABASE_URL");
const databaseLineDirect = databaseUrl
  ? `DATABASE_URL="${databaseUrl.replace(/"/g, '\\"')}"`
  : "DATABASE_URL=<<< MANUAL: postgresql://user:pass@host:5432/postgres >>>";

const poolerUrl = databaseUrl ? supabaseDirectToPoolerUrl(databaseUrl) : null;
const databaseLineWeb = poolerUrl
  ? `DATABASE_URL="${poolerUrl.replace(/"/g, '\\"')}"`
  : databaseLineDirect;
const directUrlLine = poolerUrl
  ? `DIRECT_URL="${databaseUrl.replace(/"/g, '\\"')}"`
  : "";

const renderApiUrl = process.env.RENDER_API_URL?.trim() || RENDER_API_DEFAULT;
const apiUrlLine = `API_URL=${renderApiUrl}`;

const lines = [
  "# =============================================================================",
  "# PRONUXFIN — produção (gerado automaticamente)",
  "# Copie cada bloco para o painel correto (Vercel / Render).",
  "# Preencha os campos marcados <<< MANUAL >>> antes do deploy.",
  "# =============================================================================",
  "",
  "# --- Vercel (web) — Environment: Production ---",
  "",
  `NEXT_PUBLIC_SITE_URL=${SITE}`,
  apiUrlLine,
  `# Depois do DNS api.* (Parte 5): API_URL=${API_URL_AFTER_DNS}`,
  "",
  "JWT_ALGORITHM=RS256",
  `JWT_PUBLIC_KEY="${pubOneLine}"`,
  `INTERNAL_API_SECRET=${internalSecret}`,
  "INTERNAL_API_REQUEST_SIGNING=1",
  "PASSWORD_BREACH_CHECK=1",
  "",
  "CSRF_ENFORCE=1",
  "AUTH_SESSION_VERSION_CHECK=1",
  "COOKIE_SAMESITE_STRICT=1",
  "CSP_MODE=enforce",
  "",
  `AI_KEYS_ENCRYPTION_KEY=${aiKeysEncryptionKey}`,
  `HEALTH_PROBE_SECRET=${healthProbeSecret}`,
  "",
  `WEBAUTHN_RP_ID=${RP_ID}`,
  `WEBAUTHN_ORIGIN=${SITE}`,
  "SECURITY_CONTACT_EMAIL=security@pronuxfin.com.br",
  "",
  databaseLineWeb,
  poolerUrl ? directUrlLine : "",
  poolerUrl ? "# Vercel: pooler :6543 (queries). DIRECT_URL :5432 (migrate no build)." : "",
  "",
  "OPENAI_API_KEY=<<< MANUAL: sk-... >>>",
  "# GEMINI_API_KEY=<<< alternativa ao OpenAI >>>",
  "",
  "BRAPI_TOKEN=<<< MANUAL: token brapi.dev >>>",
  "BRAPI_MAX_SYMBOLS_PER_REQUEST=12",
  "BRAPI_PARALLEL_REQUESTS=6",
  "PRONUX_LIVE_DESK_BR_MAX=72",
  "FMP_API_KEY=<<< MANUAL: financialmodelingprep.com >>>",
  "",
  "# Opcional — observabilidade",
  "# NEXT_PUBLIC_SENTRY_DSN=",
  "# SENTRY_DSN=",
  "",
  "# --- Backend (Render / Railway / VPS) — NODE_ENV=production ---",
  "",
  "JWT_ALGORITHM=RS256",
  `JWT_PRIVATE_KEY="${privOneLine}"`,
  `JWT_PUBLIC_KEY="${pubOneLine}"`,
  `INTERNAL_API_SECRET=${internalSecret}`,
  "INTERNAL_API_REQUEST_SIGNING=1",
  "REFRESH_STRICT_BIND=1",
  "MAX_REFRESH_FAMILIES_PER_USER=8",
  "PASSWORD_BREACH_CHECK=1",
  "",
  `FRONTEND_URL=${SITE}`,
  "FRONTEND_URLS=https://pronuxfin.com.br,https://pronuxfin.vercel.app",
  "TRUST_PROXY=1",
  "",
  `WEBAUTHN_RP_ID=${RP_ID}`,
  `WEBAUTHN_ORIGIN=${SITE}`,
  "WEBAUTHN_RP_NAME=PRONUXFIN",
  "",
  databaseLineDirect,
  "",
  "SMTP_URL=<<< MANUAL: smtps://user:pass@smtp.provedor.com:465 >>>",
  'SMTP_FROM="PRONUXFIN <no-reply@pronuxfin.com.br>"',
  "# AUTH_RESET_DEV_LOG_ONLY=false",
  "",
  "PLATFORM_ADMIN_EMAILS=<<< MANUAL: seu@email.com >>>",
  "# PLATFORM_ADMIN_IP_ALLOWLIST=<<< opcional: IP fixo do admin >>>",
  "",
];

const outPath = resolve(import.meta.dirname, "..", ".env.production.generated");
writeFileSync(outPath, lines.join("\n") + "\n", "utf8");

console.log("PRONUXFIN — kit de produção gerado\n");
console.log(`Ficheiro: ${outPath}`);
console.log("\nPróximos passos:");
console.log("  1. Preencha DATABASE_URL, OPENAI_API_KEY (ou GEMINI), BRAPI_TOKEN, FMP, SMTP");
console.log("  2. Cole as variáveis WEB na Vercel (Settings → Environment Variables → Production)");
console.log("  3. Cole as variáveis BACKEND no host da API Nest");
console.log("  4. npm run migrate:deploy   (se ainda não aplicou migrações)");
console.log("  4b. npm run production:probe   (smoke remoto www + API)");
console.log("  5. npm run production:verify -- .env.production.generated");
console.log("  6. Redeploy Vercel + backend");
console.log(`\nDomínio: www.pronuxfin.com.br | API agora: ${renderApiUrl}`);
console.log(`Depois do DNS: ${API_URL_AFTER_DNS}`);
console.log("Se já tem .env.production.generated com chaves, use: npm run production:patch-env");
console.log("Nunca commite este ficheiro no Git.\n");
