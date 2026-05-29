import { describe, expect, it } from "vitest";
import {
  csrfTokensMatch,
  isAcceptableAuthEntryOrigin,
  isAcceptableSecFetchSite,
  parseCookieValue,
} from "./csrf";

describe("csrf", () => {
  it("matches header and cookie", () => {
    const token = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    expect(csrfTokensMatch(token, token)).toBe(true);
    expect(csrfTokensMatch(token, token + "x")).toBe(false);
  });

  it("parses cookie header", () => {
    expect(
      parseCookieValue("pronuxfin_csrf=abc; other=1", "pronuxfin_csrf"),
    ).toBe("abc");
  });

  it("rejects cross-site sec-fetch", () => {
    const req = new Request("http://localhost/api/x", {
      method: "POST",
      headers: { "sec-fetch-site": "cross-site" },
    });
    expect(isAcceptableSecFetchSite(req)).toBe(false);
  });

  it("accepts same-origin auth entry", () => {
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        host: "localhost:3000",
        "sec-fetch-site": "same-origin",
      },
    });
    expect(isAcceptableAuthEntryOrigin(req)).toBe(true);
  });
});
