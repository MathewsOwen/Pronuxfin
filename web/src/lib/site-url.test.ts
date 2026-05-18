import { afterEach, describe, expect, it, vi } from "vitest";

import {
  hasPublicSiteUrlConfigured,
  publicSiteUrlReadinessDetail,
  resolvePublicSiteUrl,
} from "@/lib/site-url";

describe("site-url", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("resolves explicit NEXT_PUBLIC_SITE_URL origin", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.pronuxfin.com.br/path");
    vi.stubEnv("VERCEL_URL", "");
    expect(resolvePublicSiteUrl()).toBe("https://www.pronuxfin.com.br");
    expect(hasPublicSiteUrlConfigured()).toBe(true);
    expect(publicSiteUrlReadinessDetail()).toBe("configured");
  });

  it("infers URL from VERCEL_URL when explicit site URL is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "pronuxfin.vercel.app");
    expect(resolvePublicSiteUrl()).toBe("https://pronuxfin.vercel.app");
    expect(hasPublicSiteUrlConfigured()).toBe(true);
    expect(publicSiteUrlReadinessDetail()).toBe("inferred from VERCEL_URL");
  });

  it("falls back to localhost in development", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect(resolvePublicSiteUrl()).toBe("http://localhost:3000");
    expect(hasPublicSiteUrlConfigured()).toBe(false);
  });
});
