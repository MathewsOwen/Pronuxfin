import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session-user", () => ({
  getSessionUserId: vi.fn(async () => null),
}));

import { POST } from "./route";

describe("POST /api/quotes/lookup/batch", () => {
  it("returns 401 without session", async () => {
    const res = await POST(
      new Request("http://localhost/api/quotes/lookup/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: ["PETR4"] }),
      }),
    );
    expect(res.status).toBe(401);
  });
});
