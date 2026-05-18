import { afterEach, describe, expect, it, vi } from "vitest";

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
