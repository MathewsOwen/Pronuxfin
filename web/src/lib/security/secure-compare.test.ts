import { describe, expect, it } from "vitest";

import {
  isInternalApiProbe,
  secureCompareStrings,
} from "./secure-compare";

describe("secure-compare", () => {
  it("matches equal strings in constant time semantics", () => {
    expect(secureCompareStrings("abc", "abc")).toBe(true);
    expect(secureCompareStrings("abc", "abd")).toBe(false);
    expect(secureCompareStrings("abc", "abcd")).toBe(false);
  });

  it("validates internal probe header", () => {
    const secret = "a".repeat(32);
    process.env.INTERNAL_API_SECRET = secret;
    const req = new Request("http://localhost/api/health/market", {
      headers: { "x-internal-auth": secret },
    });
    expect(isInternalApiProbe(req)).toBe(true);
    expect(
      isInternalApiProbe(
        new Request("http://localhost", {
          headers: { "x-internal-auth": "wrong" },
        }),
      ),
    ).toBe(false);
    delete process.env.INTERNAL_API_SECRET;
  });
});
