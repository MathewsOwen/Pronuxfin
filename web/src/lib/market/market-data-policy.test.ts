import { afterEach, describe, expect, it, vi } from "vitest";

import {
  resolveMarketProviderFallback,
  resolveQuotesDataMode,
  shouldUseSimulatedMarketData,
} from "@/lib/market/market-data-policy";

describe("market-data-policy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("blocks simulation in development without opt-in", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("MARKET_ALLOW_SIMULATION", "");
    expect(shouldUseSimulatedMarketData()).toBe(false);
  });

  it("blocks silent simulation in production without opt-in", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MARKET_ALLOW_SIMULATION", "");
    expect(shouldUseSimulatedMarketData()).toBe(false);

    const result = resolveMarketProviderFallback("br_equities_snapshot", () => ({
      rows: [{ symbol: "PETR4" }],
      simulated: true,
      partial: false,
      warning: "equities_fallback_budget",
    }));

    expect(result.rows).toHaveLength(0);
    expect(result.simulated).toBe(false);
    expect(result.warning).toContain("market_simulation_blocked");
  });

  it("allows simulation in production with MARKET_ALLOW_SIMULATION=1", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MARKET_ALLOW_SIMULATION", "1");

    const result = resolveMarketProviderFallback("crypto_snapshot", () => ({
      rows: [{ symbol: "BTC" }],
      simulated: true,
      partial: false,
    }));

    expect(result.rows).toHaveLength(1);
    expect(result.simulated).toBe(true);
  });

  it("resolves quotes data mode", () => {
    expect(
      resolveQuotesDataMode({
        resultsCount: 5,
        cryptoCount: 2,
        simulated: false,
        cryptoSimulated: false,
      }),
    ).toBe("live");
    expect(
      resolveQuotesDataMode({
        resultsCount: 0,
        cryptoCount: 0,
        simulated: true,
      }),
    ).toBe("simulated");
    expect(
      resolveQuotesDataMode({
        resultsCount: 0,
        cryptoCount: 0,
        simulated: false,
      }),
    ).toBe("degraded");
  });
});
