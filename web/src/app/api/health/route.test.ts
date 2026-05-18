import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns 200 with service liveness payload", async () => {
    const res = await GET();
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
