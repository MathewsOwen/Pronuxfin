import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/health/ready/route";

vi.mock("@/lib/health/web-readiness", () => ({
  evaluateWebReadiness: vi.fn(),
}));

vi.mock("@/lib/security/distributed-rate-limit", () => ({
  consumeRateLimit: vi.fn(async () => ({ ok: true, retryAfterSec: 60 })),
}));

import { evaluateWebReadiness } from "@/lib/health/web-readiness";

const mockEvaluate = vi.mocked(evaluateWebReadiness);

describe("GET /api/health/ready", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns 200 with minimal body when ready", async () => {
    mockEvaluate.mockResolvedValue({
      ok: true,
      checks: {
        api_url_configured: true,
        site_url_configured: true,
        site_url_detail: "configured",
        jwt_secret_configured: true,
        jwt_secret_detail: "configured",
        backend_ready: true,
        backend_status: 200,
        database_configured: true,
        database_ready: true,
      },
    });

    const res = await GET(new Request("http://localhost/api/health/ready"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.checks).toBeUndefined();
  });

  it("returns 503 when not ready", async () => {
    mockEvaluate.mockResolvedValue({
      ok: false,
      checks: {
        api_url_configured: false,
        site_url_configured: true,
        site_url_detail: "configured",
        jwt_secret_configured: true,
        jwt_secret_detail: "configured",
        backend_ready: false,
        backend_status: null,
        database_configured: true,
        database_ready: true,
      },
    });

    const res = await GET(new Request("http://localhost/api/health/ready"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.failed_checks).toBeUndefined();
  });

  it("includes checks when probe secret matches", async () => {
    vi.stubEnv("HEALTH_PROBE_SECRET", "a".repeat(32));
    mockEvaluate.mockResolvedValue({
      ok: false,
      checks: {
        api_url_configured: true,
        site_url_configured: true,
        site_url_detail: "configured",
        jwt_secret_configured: true,
        jwt_secret_detail: "configured",
        backend_ready: false,
        backend_status: 503,
        database_configured: true,
        database_ready: true,
      },
    });

    const res = await GET(
      new Request("http://localhost/api/health/ready", {
        headers: { Authorization: `Bearer ${"a".repeat(32)}` },
      }),
    );
    const body = await res.json();
    expect(body.checks?.backend_ready).toBe(false);
  });
});
