import { afterEach, describe, expect, it, vi } from "vitest";

import {
  evaluateMarketCapabilities,
  isFmpProviderEnabled,
} from "@/lib/market/market-capabilities";

describe("market-capabilities", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("enables FMP when API key is present", () => {
    vi.stubEnv("FMP_API_KEY", "test-key");
    vi.stubEnv("MARKET_PROVIDER_FMP_ENABLED", "");
    expect(isFmpProviderEnabled()).toBe(true);
  });

  it("disables FMP when explicitly turned off", () => {
    vi.stubEnv("FMP_API_KEY", "test-key");
    vi.stubEnv("MARKET_PROVIDER_FMP_ENABLED", "false");
    expect(isFmpProviderEnabled()).toBe(false);
  });

  it("flags live desk readiness when BRAPI and strict production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BRAPI_TOKEN", "token");
    vi.stubEnv("MARKET_ALLOW_SIMULATION", "");
    const caps = evaluateMarketCapabilities();
    expect(caps.readyForLiveDesk).toBe(true);
    expect(caps.brapi.configured).toBe(true);
  });
});
