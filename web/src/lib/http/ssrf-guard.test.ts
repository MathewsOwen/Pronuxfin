import { describe, expect, it } from "vitest";

import { isBlockedHost, isSafeHttpUrl } from "./ssrf-guard";

describe("ssrf-guard", () => {
  it("blocks localhost and private IPv4", () => {
    expect(isBlockedHost("localhost")).toBe(true);
    expect(isBlockedHost("127.0.0.1")).toBe(true);
    expect(isBlockedHost("10.0.0.1")).toBe(true);
    expect(isBlockedHost("192.168.1.1")).toBe(true);
    expect(isBlockedHost("169.254.169.254")).toBe(true);
  });

  it("allows public hostnames", () => {
    expect(isBlockedHost("example.com")).toBe(false);
    expect(isBlockedHost("feeds.bbci.co.uk")).toBe(false);
  });

  it("validates safe http(s) URLs", () => {
    expect(isSafeHttpUrl("https://example.com/rss")).toBe(true);
    expect(isSafeHttpUrl("http://127.0.0.1/")).toBe(false);
    expect(isSafeHttpUrl("file:///etc/passwd")).toBe(false);
  });
});
