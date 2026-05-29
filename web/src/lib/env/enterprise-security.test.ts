import { afterEach, describe, expect, it, vi } from "vitest";

import { evaluateEnterpriseSecurityHints } from "@/lib/env/enterprise-security";

describe("evaluateEnterpriseSecurityHints", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns empty outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    expect(evaluateEnterpriseSecurityHints()).toEqual([]);
  });

  it("flags missing RS256 in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("JWT_ALGORITHM", "");
    vi.stubEnv("JWT_PUBLIC_KEY", "");
    const hints = evaluateEnterpriseSecurityHints();
    expect(hints.some((h) => h.key === "jwt_rs256" && !h.ok)).toBe(true);
  });

  it("flags missing WebAuthn config in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("WEBAUTHN_RP_ID", "");
    vi.stubEnv("WEBAUTHN_ORIGIN", "");
    const hints = evaluateEnterpriseSecurityHints();
    expect(hints.some((h) => h.key === "webauthn_production" && !h.ok)).toBe(true);
  });
});
