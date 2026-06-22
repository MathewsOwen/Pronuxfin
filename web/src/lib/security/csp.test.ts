import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildContentSecurityPolicy,
  cspHeaderName,
  resolveCspMode,
} from "./csp";

describe("csp", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to enforce in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(resolveCspMode()).toBe("enforce");
  });

  it("defaults to report-only in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(resolveCspMode()).toBe("report-only");
  });

  it("honours CSP_MODE override", () => {
    vi.stubEnv("CSP_MODE", "report-only");
    expect(resolveCspMode()).toBe("report-only");
  });

  it("builds script-src with nonce and without unsafe-inline", () => {
    const policy = buildContentSecurityPolicy({
      nonce: "abc123",
      isProd: true,
    });
    expect(policy).toContain("'nonce-abc123'");
    expect(policy).toContain("'strict-dynamic'");
    const scriptSrc = policy.split(";").find((d) => d.trim().startsWith("script-src"));
    expect(scriptSrc).toBeDefined();
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(cspHeaderName("enforce")).toBe("Content-Security-Policy");
  });

  it("allows YouTube embeds for Aprenda while blocking unknown frames", () => {
    const policy = buildContentSecurityPolicy({
      nonce: "abc123",
      isProd: true,
    });
    expect(policy).toContain(
      "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com",
    );
  });
});
