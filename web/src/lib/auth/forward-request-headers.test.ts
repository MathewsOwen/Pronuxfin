import { describe, expect, it } from "vitest";

import { jsonPayloadHeaders } from "./forward-request-headers";

describe("jsonPayloadHeaders", () => {
  it("forwards client IP and User-Agent to the auth upstream", () => {
    const req = new Request("https://www.example.com/api/auth/login", {
      method: "POST",
      headers: {
        "x-forwarded-for": "203.0.113.10, 70.41.3.18",
        "user-agent": "Mozilla/5.0 Test",
        "accept-language": "pt-BR",
      },
    });

    const headers = new Headers(jsonPayloadHeaders(req));
    expect(headers.get("X-Forwarded-For")).toBe("203.0.113.10, 70.41.3.18");
    expect(headers.get("User-Agent")).toBe("Mozilla/5.0 Test");
    expect(headers.get("Accept-Language")).toBe("pt-BR");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const req = new Request("https://www.example.com/api/auth/login", {
      headers: { "x-real-ip": "198.51.100.4" },
    });
    const headers = new Headers(jsonPayloadHeaders(req));
    expect(headers.get("X-Forwarded-For")).toBe("198.51.100.4");
  });
});
