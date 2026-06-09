import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  assertProductionSecurityEnv,
  isProductionSecurityEnvValid,
} from "./production-security";

const FAKE_PUBLIC_KEY =
  "-----BEGIN PUBLIC KEY-----\n" +
  "A".repeat(64) +
  "\n-----END PUBLIC KEY-----";

const STRONG_SECRET =
  "a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0u1V2w3";

describe("production-security", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("PLAYWRIGHT_E2E", "");
    vi.stubEnv("CSRF_ENFORCE", "1");
    vi.stubEnv("AUTH_SESSION_VERSION_CHECK", "1");
    vi.stubEnv("COOKIE_SAMESITE_STRICT", "1");
    vi.stubEnv("HEALTH_PROBE_SECRET", STRONG_SECRET);
    vi.stubEnv("INTERNAL_API_SECRET", STRONG_SECRET + "X");
    vi.stubEnv("JWT_ALGORITHM", "RS256");
    vi.stubEnv("JWT_PUBLIC_KEY", FAKE_PUBLIC_KEY);
    vi.stubEnv("AI_KEYS_ENCRYPTION_KEY", "b".repeat(64));
    vi.stubEnv("WEBAUTHN_RP_ID", "www.example.com");
    vi.stubEnv("WEBAUTHN_ORIGIN", "https://www.example.com");
    vi.stubEnv("OPENAI_API_KEY", "sk-test-key");
    vi.stubEnv("CSP_MODE", "enforce");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.example.com");
    vi.stubEnv("API_URL", "https://api.example.com");
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/pronuxfin");
    vi.stubEnv("INTERNAL_API_REQUEST_SIGNING", "1");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("passes when production env is hardened", () => {
    expect(isProductionSecurityEnvValid()).toBe(true);
    expect(() => assertProductionSecurityEnv()).not.toThrow();
  });

  it("rejects CSRF disabled in production", () => {
    vi.stubEnv("CSRF_ENFORCE", "0");
    expect(isProductionSecurityEnvValid()).toBe(false);
  });

  it("rejects CSP off in production", () => {
    vi.stubEnv("CSP_MODE", "off");
    expect(isProductionSecurityEnvValid()).toBe(false);
  });

  it("rejects maintenance gate bypass in production", () => {
    vi.stubEnv("MAINTENANCE_FORCE_OFF", "1");
    expect(isProductionSecurityEnvValid()).toBe(false);
  });

  it("requires RS256 in production", () => {
    vi.stubEnv("JWT_ALGORITHM", "HS256");
    vi.stubEnv("JWT_SECRET", "b".repeat(32));
    expect(isProductionSecurityEnvValid()).toBe(false);
  });

  it("rejects market simulation in production", () => {
    vi.stubEnv("MARKET_ALLOW_SIMULATION", "1");
    expect(isProductionSecurityEnvValid()).toBe(false);
  });

  it("rejects missing BYOK encryption key in production", () => {
    vi.stubEnv("AI_KEYS_ENCRYPTION_KEY", "");
    expect(isProductionSecurityEnvValid()).toBe(false);
  });

  it("rejects invalid WebAuthn origin in production", () => {
    vi.stubEnv("WEBAUTHN_ORIGIN", "http://insecure.example.com");
    expect(isProductionSecurityEnvValid()).toBe(false);
  });

  it("rejects missing platform AI engine in production", () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "");
    vi.stubEnv("PRONUX_MARKET_AI_OLLAMA_ORIGIN", "");
    expect(isProductionSecurityEnvValid()).toBe(false);
  });

  it("requires request signing in production", () => {
    vi.stubEnv("INTERNAL_API_REQUEST_SIGNING", "0");
    expect(isProductionSecurityEnvValid()).toBe(false);
  });

  it("rejects weak INTERNAL_API_SECRET in production", () => {
    vi.stubEnv("INTERNAL_API_SECRET", "a".repeat(32));
    expect(isProductionSecurityEnvValid()).toBe(false);
  });

  it("rejects HTTP API_URL in production", () => {
    vi.stubEnv("API_URL", "http://api.example.com");
    expect(isProductionSecurityEnvValid()).toBe(false);
  });

  it("rejects missing DATABASE_URL in production", () => {
    vi.stubEnv("DATABASE_URL", "");
    expect(isProductionSecurityEnvValid()).toBe(false);
  });

  it("rejects missing HEALTH_PROBE_SECRET in production", () => {
    vi.stubEnv("HEALTH_PROBE_SECRET", "");
    expect(isProductionSecurityEnvValid()).toBe(false);
  });

  it("skips checks during Playwright E2E", () => {
    vi.stubEnv("PLAYWRIGHT_E2E", "1");
    vi.stubEnv("CSRF_ENFORCE", "0");
    vi.stubEnv("COOKIE_SAMESITE_STRICT", "0");
    expect(() => assertProductionSecurityEnv()).not.toThrow();
    expect(isProductionSecurityEnvValid()).toBe(true);
  });
});
