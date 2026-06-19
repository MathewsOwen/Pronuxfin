#!/usr/bin/env node
/**
 * Impede credenciais de produção em ficheiros .env locais (fora do painel de deploy).
 * Usage: npm run security:audit-local
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();

const LOCAL_ENV_FILES = [
  "web/.env",
  "web/.env.local",
  "backend/.env",
  "backend/.env.local",
  ".env",
];

const PRODUCTION_PATTERNS = [
  { id: "supabase_host", re: /supabase\.co/i, hint: "Use Postgres local em dev; Supabase só no painel Vercel/Render." },
  { id: "openai_key", re: /\bsk-[a-zA-Z0-9_-]{20,}/, hint: "Remova OPENAI_API_KEY do .env local." },
  { id: "jwt_private", re: /BEGIN PRIVATE KEY/, hint: "Chave privada JWT só no backend em produção." },
  { id: "brevo_smtp", re: /xsmtpsib-[a-zA-Z0-9-]+/i, hint: "SMTP de produção não deve estar em .env local." },
  { id: "pooler_supabase", re: /pooler\.supabase\.com/i, hint: "DATABASE_URL de pooler é produção." },
];

const errors = [];
const warnings = [];

for (const rel of LOCAL_ENV_FILES) {
  const abs = resolve(root, rel);
  if (!existsSync(abs)) continue;
  const content = readFileSync(abs, "utf8");
  for (const { id, re, hint } of PRODUCTION_PATTERNS) {
    if (re.test(content)) {
      errors.push(`${rel}: padrão "${id}" detectado — ${hint}`);
    }
  }
}

const generated = resolve(root, ".env.production.generated");
if (existsSync(generated)) {
  warnings.push(
    ".env.production.generated existe no disco (gitignored). Não partilhe, não envie por chat, faça backup cifrado.",
  );
}

console.log("PRONUXFIN — auditoria de segredos locais\n");

if (warnings.length > 0) {
  console.log("Avisos:");
  for (const w of warnings) console.log(`  ⚠ ${w}`);
  console.log("");
}

if (errors.length > 0) {
  console.log("Falhas (corrija antes de continuar):");
  for (const e of errors) console.log(`  ✗ ${e}`);
  console.log(
    "\nSe credenciais de produção vazaram, rode a rotação: Supabase, OpenAI, INTERNAL_API_SECRET, JWT, SMTP, BRAPI, FMP.\n",
  );
  process.exit(1);
}

console.log("OK — nenhuma credencial de produção detectada nos .env locais.\n");
