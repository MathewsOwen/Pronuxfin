import { resolveJwtAlgorithm } from "@/lib/auth/jwt-crypto";
import { isByokCryptoConfigured } from "@/lib/crypto/ai-keys-crypto";
import { readTrimmedEnv } from "@/lib/env/server-env";
import { listEnginesFromEnv } from "@/lib/market/market-ai-providers";
import { resolveCspMode } from "@/lib/security/csp";
import { assertStrongProductionSecret } from "@/lib/security/secret-strength";
import { assertHttpsProductionUrl } from "@/lib/security/validate-production-urls";

function isStrictProductionEnv(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

function isTruthyEnv(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** Playwright boots `next start` in production mode without a full deploy stack. */
function isPlaywrightE2e(): boolean {
  return process.env.PLAYWRIGHT_E2E === "1";
}

/** Production must not run with security features explicitly disabled. */
export function assertProductionSecurityEnv(): void {
  if (isPlaywrightE2e()) return;
  if (!isStrictProductionEnv()) return;

  if (process.env.CSRF_ENFORCE === "0") {
    throw new Error("CSRF_ENFORCE=0 is forbidden in production.");
  }
  if (process.env.AUTH_SESSION_VERSION_CHECK === "0") {
    throw new Error("AUTH_SESSION_VERSION_CHECK=0 is forbidden in production.");
  }
  if (process.env.MAINTENANCE_FORCE_OFF === "1") {
    throw new Error("MAINTENANCE_FORCE_OFF=1 bypasses readiness gate in production.");
  }
  if (process.env.MARKET_ALLOW_SIMULATION === "1") {
    throw new Error("MARKET_ALLOW_SIMULATION=1 is forbidden in production.");
  }
  if (!isTruthyEnv("COOKIE_SAMESITE_STRICT")) {
    throw new Error("COOKIE_SAMESITE_STRICT=1 is required in production.");
  }
  if (!isTruthyEnv("CSRF_ENFORCE")) {
    throw new Error("CSRF_ENFORCE=1 is required in production.");
  }
  if (!isTruthyEnv("AUTH_SESSION_VERSION_CHECK")) {
    throw new Error("AUTH_SESSION_VERSION_CHECK=1 is required in production.");
  }

  const probeSecret = process.env.HEALTH_PROBE_SECRET?.trim() ?? "";
  if (probeSecret.length < 32) {
    throw new Error(
      "HEALTH_PROBE_SECRET must be set (≥32 chars) in production.",
    );
  }

  const csp = resolveCspMode();
  if (csp === "off") {
    throw new Error("CSP must be enforced in production (CSP_MODE=enforce).");
  }

  const internal = process.env.INTERNAL_API_SECRET?.trim() ?? "";
  if (internal.length < 32) {
    throw new Error(
      "INTERNAL_API_SECRET must be set (≥32 chars) in production.",
    );
  }
  assertStrongProductionSecret("INTERNAL_API_SECRET", internal);
  assertStrongProductionSecret("HEALTH_PROBE_SECRET", probeSecret);

  if (resolveJwtAlgorithm() !== "RS256") {
    throw new Error("JWT_ALGORITHM=RS256 is required in production.");
  }

  const pem = process.env.JWT_PUBLIC_KEY?.trim() ?? "";
  if (!pem.includes("BEGIN PUBLIC KEY")) {
    throw new Error("JWT_PUBLIC_KEY is required for RS256 in production.");
  }

  if (!isByokCryptoConfigured()) {
    throw new Error(
      "AI_KEYS_ENCRYPTION_KEY must be 64 hex chars (32 bytes) in production.",
    );
  }

  const rpId = process.env.WEBAUTHN_RP_ID?.trim() ?? "";
  const webauthnOrigin = process.env.WEBAUTHN_ORIGIN?.trim() ?? "";
  if (
    !rpId ||
    !webauthnOrigin ||
    !webauthnOrigin.startsWith("https://") ||
    webauthnOrigin.endsWith("/")
  ) {
    throw new Error(
      "WEBAUTHN_RP_ID and WEBAUTHN_ORIGIN (https, no trailing slash) are required in production.",
    );
  }

  if (listEnginesFromEnv().length === 0) {
    throw new Error(
      "At least one platform AI engine is required in production (FABLE_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, or PRONUX_MARKET_AI_OLLAMA_ORIGIN).",
    );
  }

  assertHttpsProductionUrl("API_URL", readTrimmedEnv("API_URL"));
  assertHttpsProductionUrl(
    "NEXT_PUBLIC_SITE_URL",
    readTrimmedEnv("NEXT_PUBLIC_SITE_URL"),
  );
  assertHttpsProductionUrl("WEBAUTHN_ORIGIN", webauthnOrigin);

  if (!readTrimmedEnv("DATABASE_URL")) {
    throw new Error("DATABASE_URL is required in production.");
  }

  if (!isTruthyEnv("INTERNAL_API_REQUEST_SIGNING")) {
    throw new Error("INTERNAL_API_REQUEST_SIGNING=1 is required in production.");
  }
}
export function isProductionSecurityEnvValid(): boolean {
  if (!isStrictProductionEnv()) return true;
  try {
    assertProductionSecurityEnv();
    return true;
  } catch {
    return false;
  }
}
