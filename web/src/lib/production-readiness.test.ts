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
    expect(result.checks).toHaveLength(0);
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
    expect(result.checks.every((c) => c.ok)).toBe(true);
  });

  it("fails when JWT_SECRET is missing in production", async () => {
    vi.stubEnv("JWT_SECRET", "");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200 }),
    );

    const result = await evaluateProductionReadiness();
    expect(result.ok).toBe(false);
    expect(result.checks.find((c) => c.key === "jwt_secret_configured")?.ok).toBe(false);
  });

  it("fails when public site URL cannot be determined", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "");

    const result = await evaluateProductionReadiness();
    expect(result.ok).toBe(false);
    expect(result.checks.find((c) => c.key === "site_url_configured")?.ok).toBe(false);
  });
});
