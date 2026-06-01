import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { evaluateProductionReadiness } from "@/lib/production-readiness";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
  },
}));

const FAKE_PUBLIC_KEY =
  "-----BEGIN PUBLIC KEY-----\n" +
  "A".repeat(64) +
  "\n-----END PUBLIC KEY-----";

describe("evaluateProductionReadiness", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MAINTENANCE_FORCE_OFF", "");
    vi.stubEnv("MAINTENANCE_FORCE_ON", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.pronuxfin.com.br");
    vi.stubEnv("API_URL", "https://api.pronuxfin.test");
    vi.stubEnv("JWT_ALGORITHM", "RS256");
    vi.stubEnv("JWT_PUBLIC_KEY", FAKE_PUBLIC_KEY);
    vi.stubEnv("JWT_SECRET", "");
    vi.stubEnv("INTERNAL_API_SECRET", "b".repeat(32));
    vi.stubEnv("COOKIE_SAMESITE_STRICT", "1");
    vi.stubEnv("AI_KEYS_ENCRYPTION_KEY", "c".repeat(64));
    vi.stubEnv("WEBAUTHN_RP_ID", "www.pronuxfin.com.br");
    vi.stubEnv("WEBAUTHN_ORIGIN", "https://www.pronuxfin.com.br");
    vi.stubEnv("OPENAI_API_KEY", "sk-test-key");
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@localhost:5432/pronuxfin");
    vi.stubEnv("VERCEL_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("is disabled outside production gate", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const result = await evaluateProductionReadiness();
    expect(result.enabled).toBe(false);
    expect(result.ok).toBe(true);
    expect(result.criticalOk).toBe(true);
    expect(result.checks).toHaveLength(0);
    expect(result.criticalChecks).toHaveLength(0);
  });

  it("passes when all production checks succeed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      }),
    );

    const result = await evaluateProductionReadiness();
    expect(result.enabled).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.criticalOk).toBe(true);
    expect(result.runtimeReason).toBeUndefined();
    expect(result.checks.every((c) => c.ok)).toBe(true);
  });

  it("fails critical when JWT is missing in production", async () => {
    vi.stubEnv("JWT_ALGORITHM", "HS256");
    vi.stubEnv("JWT_PUBLIC_KEY", "");
    vi.stubEnv("JWT_SECRET", "");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200 }),
    );

    const result = await evaluateProductionReadiness();
    expect(result.ok).toBe(false);
    expect(result.criticalOk).toBe(false);
    expect(result.criticalChecks.find((c) => c.key === "jwt_secret_configured")?.ok).toBe(false);
  });

  it("fails critical when public site URL cannot be determined", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "");

    const result = await evaluateProductionReadiness();
    expect(result.ok).toBe(false);
    expect(result.criticalOk).toBe(false);
    expect(result.criticalChecks.find((c) => c.key === "site_url_configured")?.ok).toBe(false);
  });

  it("keeps criticalOk when only runtime checks (backend) fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("backend offline")),
    );

    const result = await evaluateProductionReadiness();
    expect(result.criticalOk).toBe(true);
    expect(result.ok).toBe(false);
    expect(result.runtimeReason).toMatch(/api/i);
    expect(result.checks.find((c) => c.key === "backend_ready")?.ok).toBe(false);
  });
});
