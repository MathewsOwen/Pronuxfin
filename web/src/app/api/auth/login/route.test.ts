import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/security/auth-rate-limit", () => ({
  getRateLimitClientKey: vi.fn(() => "test-client"),
  rateLimitLogin: vi.fn().mockResolvedValue({ ok: true, retryAfterSec: 60 }),
  authRateLimitedResponse: vi.fn(),
}));

vi.mock("@/lib/security/mutation-guard", () => ({
  assertAuthEntryAllowed: vi.fn(() => null),
}));

import { POST } from "@/app/api/auth/login/route";

describe("POST /api/auth/login", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns 500 when API_URL is not configured", async () => {
    vi.stubEnv("API_URL", "");

    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@test.com", password: "secret" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = (await res.json()) as { code?: string; message?: string };
    expect(body.code).toBe("API_MISCONFIGURED");
    expect(body.message).toMatch(/API_URL/i);
  });

  it("returns 400 for invalid JSON body", async () => {
    vi.stubEnv("API_URL", "http://127.0.0.1:4000");

    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
