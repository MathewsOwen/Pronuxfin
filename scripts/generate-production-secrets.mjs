#!/usr/bin/env node
/**
 * Gera segredos para deploy de produção (RS256 + INTERNAL_API_SECRET).
 * Usage: node scripts/generate-production-secrets.mjs
 */

import { generateKeyPairSync, randomBytes } from "node:crypto";

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 4096,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const internalSecret = randomBytes(32).toString("base64url");

console.log("=== PRONUXFIN — segredos de produção (guarde num password manager) ===\n");
console.log("# Backend (.env produção)");
console.log("JWT_ALGORITHM=RS256");
console.log(`JWT_PRIVATE_KEY="${privateKey.trim().replace(/\n/g, "\\n")}"`);
console.log(`JWT_PUBLIC_KEY="${publicKey.trim().replace(/\n/g, "\\n")}"`);
console.log(`INTERNAL_API_SECRET=${internalSecret}`);
console.log("REFRESH_STRICT_BIND=1\n");

console.log("# Web (.env produção — NUNCA a chave privada)");
console.log("JWT_ALGORITHM=RS256");
console.log(`JWT_PUBLIC_KEY="${publicKey.trim().replace(/\n/g, "\\n")}"`);
console.log(`INTERNAL_API_SECRET=${internalSecret}`);
console.log("CSRF_ENFORCE=1");
console.log("AUTH_SESSION_VERSION_CHECK=1");
console.log("COOKIE_SAMESITE_STRICT=1");
console.log("CSP_MODE=enforce");
console.log(`AI_KEYS_ENCRYPTION_KEY=${randomBytes(32).toString("hex")}`);
console.log("WEBAUTHN_RP_ID=www.pronuxfin.com.br");
console.log("WEBAUTHN_ORIGIN=https://www.pronuxfin.com.br");
console.log("NEXT_PUBLIC_SITE_URL=https://www.pronuxfin.com.br");
console.log("API_URL=https://api.pronuxfin.com.br");
console.log("OPENAI_API_KEY=sk-...  # ou GEMINI_API_KEY / PRONUX_MARKET_AI_OLLAMA_ORIGIN");
console.log("");

console.log("Rode novamente após rotação. Nunca commite estes valores no Git.");
