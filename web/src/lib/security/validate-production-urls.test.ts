import { describe, expect, it } from "vitest";

import { assertHttpsProductionUrl } from "./validate-production-urls";

describe("validate-production-urls", () => {
  it("accepts valid HTTPS URLs", () => {
    expect(() =>
      assertHttpsProductionUrl("API_URL", "https://api.example.com"),
    ).not.toThrow();
  });

  it("rejects HTTP URLs", () => {
    expect(() =>
      assertHttpsProductionUrl("API_URL", "http://api.example.com"),
    ).toThrow(/HTTPS/);
  });

  it("rejects trailing slash paths", () => {
    expect(() =>
      assertHttpsProductionUrl("WEBAUTHN_ORIGIN", "https://www.example.com/"),
    ).toThrow(/trailing slash/);
  });
});
