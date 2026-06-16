#!/usr/bin/env node
/**
 * Testa assinatura BFF → API Render (diagnóstico INTERNAL_API_SECRET).
 * Usage: node scripts/probe-internal-api-signing.mjs
 */

import { createHmac, createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const API = (process.env.RENDER_API_URL ?? "https://pronuxfin.onrender.com").replace(
  /\/+$/,
  "",
);
const envPath = resolve(import.meta.dirname, "..", ".env.production.generated");

function parseEnv(text) {
  const env = {};
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

if (!existsSync(envPath)) {
  console.error("FAIL: .env.production.generated não encontrado");
  process.exit(1);
}

const env = parseEnv(readFileSync(envPath, "utf8"));
const secret = env.INTERNAL_API_SECRET?.trim();
if (!secret || secret.length < 32) {
  console.error("FAIL: INTERNAL_API_SECRET inválido no ficheiro local");
  process.exit(1);
}

function sign(method, path, body) {
  const bodySha256 = createHash("sha256").update(body ?? "", "utf8").digest("hex");
  const timestampSec = Math.floor(Date.now() / 1000);
  const payload = [String(timestampSec), method.toUpperCase(), path, bodySha256].join(
    "\n",
  );
  const signature = createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("base64url");
  return {
    "x-internal-timestamp": String(timestampSec),
    "x-internal-body-sha256": bodySha256,
    "x-internal-signature": signature,
  };
}

const path = "/auth/register";
const body = JSON.stringify({
  email: `sign-probe-${Date.now()}@example.com`,
  password: "Magiluka2024!Fin",
  name: "Sign Probe",
});

const res = await fetch(`${API}${path}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...sign("POST", path, body),
  },
  body,
});

const text = await res.text();
console.log("API:", API);
console.log("POST /auth/register (assinado com secret local):", res.status);
console.log(text.slice(0, 400));

if (res.status === 401) {
  console.log(
    "\n→ Render rejeitou a assinatura: INTERNAL_API_SECRET no Render ≠ valor em .env.production.generated",
  );
  console.log("  Cole o mesmo INTERNAL_API_SECRET na Vercel E no Render, depois redeploy ambos.");
  process.exit(1);
}

if (res.status === 201 || res.status === 200) {
  console.log("\n→ Secret local bate com Render. Se o site falha, Vercel tem INTERNAL_API_SECRET diferente.");
  process.exit(0);
}

console.log("\n→ Resposta inesperada — verifique logs Render.");
process.exit(1);
