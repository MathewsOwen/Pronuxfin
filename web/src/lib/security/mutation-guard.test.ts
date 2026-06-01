import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  assertJsonContentType,
  assertSameOriginNavigation,
} from "./mutation-guard";

describe("mutation-guard hardening", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects non-JSON content type on mutations", () => {
    const req = new Request("http://localhost/api/user/profile", {
      method: "PATCH",
      headers: { "content-type": "text/plain" },
    });
    const blocked = assertJsonContentType(req);
    expect(blocked?.status).toBe(415);
  });

  it("allows application/json mutations", () => {
    const req = new Request("http://localhost/api/user/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
    });
    expect(assertJsonContentType(req)).toBeNull();
  });

  it("allows same-origin navigation refresh", () => {
    const req = new Request("http://localhost/api/auth/refresh?from=/dashboard", {
      method: "GET",
      headers: {
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "navigate",
      },
    });
    expect(assertSameOriginNavigation(req)).toBeNull();
  });

  it("blocks cross-site refresh navigation", () => {
    const req = new Request("http://localhost/api/auth/refresh?from=/dashboard", {
      method: "GET",
      headers: { "sec-fetch-site": "cross-site" },
    });
    expect(assertSameOriginNavigation(req)?.status).toBe(403);
  });
});
