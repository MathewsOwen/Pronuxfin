import { afterEach, describe, expect, it, vi } from "vitest";

import {
  degradedDeskFallbackPayload,
  resolveClientQuotesFallback,
  simulatedDeskFallbackPayload,
} from "./quotes-client-fallback";

describe("quotes-client-fallback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns degraded payload in production without public simulation flag", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_MARKET_ALLOW_SIMULATION", "");

    const payload = resolveClientQuotesFallback();
    expect(payload.dataMode).toBe("degraded");
    expect(payload.results).toHaveLength(0);
    expect(payload.simulated).toBe(false);
  });

  it("returns simulated payload in development", () => {
    vi.stubEnv("NODE_ENV", "development");

    const payload = resolveClientQuotesFallback();
    expect(payload.dataMode).toBe("simulated");
    expect(payload.results.length).toBeGreaterThan(0);
    expect(payload.simulated).toBe(true);
  });

  it("exposes explicit helpers", () => {
    expect(degradedDeskFallbackPayload().dataMode).toBe("degraded");
    expect(simulatedDeskFallbackPayload().dataMode).toBe("simulated");
  });
});
