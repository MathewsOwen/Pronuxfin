import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { evaluateWebReadiness } from "@/lib/health/web-readiness";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
  },
}));

describe("evaluateWebReadiness", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "https://api.pronuxfin.test");
    vi.stubEnv("JWT_SECRET", "a".repeat(32));
    vi.stubEnv("DATABASE_URL", "postgresql://u:p@localhost:5432/pronuxfin");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.pronuxfin.com.br");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200 }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns ok when all dependencies are healthy", async () => {
    const result = await evaluateWebReadiness();
    expect(result.ok).toBe(true);
    expect(result.checks.backend_ready).toBe(true);
    expect(result.checks.database_ready).toBe(true);
  });

  it("fails when JWT secret is too short", async () => {
    vi.stubEnv("JWT_SECRET", "short");
    const result = await evaluateWebReadiness();
    expect(result.ok).toBe(false);
    expect(result.checks.jwt_secret_configured).toBe(false);
  });

  it("fails when backend readiness is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );
    const result = await evaluateWebReadiness();
    expect(result.ok).toBe(false);
    expect(result.checks.backend_ready).toBe(false);
    expect(result.checks.backend_status).toBe(503);
  });
});
