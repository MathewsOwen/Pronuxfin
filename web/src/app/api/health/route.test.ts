import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/health/route";

vi.mock("@/lib/security/distributed-rate-limit", () => ({
  consumeRateLimit: vi.fn(async () => ({ ok: true, retryAfterSec: 60 })),
}));

describe("GET /api/health", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with service liveness payload", async () => {
    const res = await GET(new Request("http://localhost/api/health"));
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      status?: string;
      service?: string;
      timestamp?: string;
    };
    expect(body.status).toBe("ok");
    expect(body.service).toBe("pronuxfin-web");
    expect(body.timestamp).toBeTruthy();
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });
});
