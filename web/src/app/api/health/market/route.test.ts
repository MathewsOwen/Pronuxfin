import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/health/market/route";

vi.mock("@/lib/market/market-capabilities", () => ({
  evaluateMarketCapabilities: vi.fn(),
}));

import { evaluateMarketCapabilities } from "@/lib/market/market-capabilities";

const mockCaps = vi.mocked(evaluateMarketCapabilities);

describe("GET /api/health/market", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 when live desk is ready", async () => {
    mockCaps.mockReturnValue({
      simulationAllowed: false,
      productionStrict: true,
      brapi: { configured: true, providerEnabled: true },
      fmp: { configured: true, providerEnabled: true },
      coingecko: { providerEnabled: true },
      readyForLiveDesk: true,
      recommendations: [],
    });

    const res = await GET(new Request("http://localhost/api/health/market"));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  it("returns 503 when BRAPI is missing in production", async () => {
    mockCaps.mockReturnValue({
      simulationAllowed: false,
      productionStrict: true,
      brapi: { configured: false, providerEnabled: true },
      fmp: { configured: false, providerEnabled: false },
      coingecko: { providerEnabled: true },
      readyForLiveDesk: false,
      recommendations: ["configure BRAPI_TOKEN"],
    });

    const res = await GET(new Request("http://localhost/api/health/market"));
    expect(res.status).toBe(503);
  });
});
