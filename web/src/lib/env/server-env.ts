/** Validação central de variáveis do servidor Next (BFF + Prisma). */

const MIN_JWT_SECRET_LENGTH = 32;

export function isProductionRuntime(): boolean {
  if (process.env.MAINTENANCE_FORCE_ON === "1") return true;
  if (process.env.MAINTENANCE_FORCE_OFF === "1") return false;
  return process.env.NODE_ENV === "production";
}

export function readTrimmedEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function jwtUsesRs256(): boolean {
  return readTrimmedEnv("JWT_ALGORITHM").toUpperCase() === "RS256";
}

export function isJwtSecretConfigured(): boolean {
  if (jwtUsesRs256()) {
    const pem = readTrimmedEnv("JWT_PUBLIC_KEY");
    return pem.includes("BEGIN PUBLIC KEY") && pem.length >= 64;
  }
  return readTrimmedEnv("JWT_SECRET").length >= MIN_JWT_SECRET_LENGTH;
}

export function jwtSecretReadinessDetail(): string {
  if (jwtUsesRs256()) {
    const pem = readTrimmedEnv("JWT_PUBLIC_KEY");
    if (!pem.includes("BEGIN PUBLIC KEY")) return "missing JWT_PUBLIC_KEY (RS256)";
    return "configured (RS256 public key)";
  }
  const len = readTrimmedEnv("JWT_SECRET").length;
  if (len === 0) return "missing JWT_SECRET";
  if (len < MIN_JWT_SECRET_LENGTH) {
    return `JWT_SECRET too short (${len} chars, need ${MIN_JWT_SECRET_LENGTH})`;
  }
  return "configured (HS256)";
}

export function isDatabaseUrlConfigured(): boolean {
  return readTrimmedEnv("DATABASE_URL").length > 0;
}

export function isApiUrlConfigured(): boolean {
  return readTrimmedEnv("API_URL").length > 0;
}

/** Motivo de degradação por configuração ausente (apenas em produção). */
export function configDegradationReason(): string | undefined {
  if (!isProductionRuntime()) return undefined;

  if (!isApiUrlConfigured()) {
    return "API_URL não configurada no frontend.";
  }
  if (!isJwtSecretConfigured()) {
    return jwtUsesRs256()
      ? "JWT_PUBLIC_KEY ausente ou inválida no frontend (RS256)."
      : "JWT_SECRET ausente ou curto no frontend (mín. 32 caracteres).";
  }
  if (!isDatabaseUrlConfigured()) {
    return "DATABASE_URL não configurada no frontend.";
  }
  return undefined;
}
