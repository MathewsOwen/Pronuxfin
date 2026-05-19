import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { evaluateProductionReadiness } from "@/lib/production-readiness";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
  },
}));

describe("evaluateProductionReadiness", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MAINTENANCE_FORCE_OFF", "");
    vi.stubEnv("MAINTENANCE_FORCE_ON", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.pronuxfin.com.br");
    vi.stubEnv("API_URL", "https://api.pronuxfin.test");
    vi.stubEnv("JWT_SECRET", "a".repeat(32));
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

  it("fails critical when JWT_SECRET is missing in production", async () => {
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
