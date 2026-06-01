#!/usr/bin/env node
/**
 * Gera segredos + ficheiro `.env.production.generated` para go-live pronuxfin.com.br.
 * Usage: node scripts/setup-pronuxfin-production.mjs
 *
 * NUNCA commite `.env.production.generated` — já está coberto por `.env.*` no .gitignore.
 */

import { generateKeyPairSync, randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SITE = "https://www.pronuxfin.com.br";
const RP_ID = "www.pronuxfin.com.br";
const API_URL = "https://api.pronuxfin.com.br";

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
  `API_URL=${API_URL}`,
  "",
  "JWT_ALGORITHM=RS256",
  `JWT_PUBLIC_KEY="${pubOneLine}"`,
  `INTERNAL_API_SECRET=${internalSecret}`,
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
  "DATABASE_URL=<<< MANUAL: postgresql://user:pass@host:5432/pronuxfin >>>",
  "",
  "OPENAI_API_KEY=<<< MANUAL: sk-... >>>",
  "# GEMINI_API_KEY=<<< alternativa ao OpenAI >>>",
  "",
  "BRAPI_TOKEN=<<< MANUAL: token brapi.dev >>>",
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
  "REFRESH_STRICT_BIND=1",
  "",
  `FRONTEND_URL=${SITE}`,
  "FRONTEND_URLS=https://pronuxfin.com.br,https://pronuxfin.vercel.app",
  "TRUST_PROXY=1",
  "",
  `WEBAUTHN_RP_ID=${RP_ID}`,
  `WEBAUTHN_ORIGIN=${SITE}`,
  "WEBAUTHN_RP_NAME=PRONUXFIN",
  "",
  "DATABASE_URL=<<< MANUAL: mesma base PostgreSQL >>>",
  "",
  "SMTP_URL=<<< MANUAL: smtps://user:pass@smtp.provedor.com:465 >>>",
  'SMTP_FROM="PRONUXFIN <no-reply@pronuxfin.com.br>"',
  "# AUTH_RESET_DEV_LOG_ONLY=false",
  "",
  "PLATFORM_ADMIN_EMAILS=<<< MANUAL: seu@email.com >>>",
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
console.log("  4. npm run migrate:deploy   (migrações Prisma)");
console.log("  5. npm run production:verify -- .env.production.generated");
console.log("  6. Redeploy Vercel + backend");
console.log("\nDomínio: www.pronuxfin.com.br | API sugerida: api.pronuxfin.com.br");
console.log("Nunca commite este ficheiro no Git.\n");
