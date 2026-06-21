import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/market/search/route";
import { searchGlobalAssets } from "@/lib/market/search-global-assets";
import { getSessionUserId } from "@/lib/auth/session-user";

vi.mock("@/lib/auth/session-user", () => ({
  getSessionUserId: vi.fn(async () => "user-1"),
}));

vi.mock("@/lib/market/search-global-assets", () => ({
  searchGlobalAssets: vi.fn(async (query: string) => ({
    query,
    results: [
      {
        symbol: "BTC",
        name: "Bitcoin",
        assetClass: "crypto" as const,
        deskMarket: null,
        exchangeLabel: "Crypto",
        countryCode: null,
        flag: "🪙",
        marketCapRank: 1,
        source: "coingecko" as const,
      },
    ],
    partial: false,
    fetchedAt: Date.now(),
  })),
}));

vi.mock("@/lib/security/distributed-rate-limit", () => ({
  consumeRateLimit: vi.fn(async () => ({ ok: true, retryAfterSec: 60 })),
}));

describe("GET /api/market/search", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for short queries", async () => {
    const res = await GET(new Request("http://localhost/api/market/search?q=a"));
    expect(res.status).toBe(400);
  });

  it("returns search hits for valid query", async () => {
    const res = await GET(new Request("http://localhost/api/market/search?q=bitcoin"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results[0]?.symbol).toBe("BTC");
    expect(searchGlobalAssets).toHaveBeenCalledWith("bitcoin", 16, {
      includeUpstream: true,
    });
  });

  it("limits anonymous users to local universe", async () => {
    vi.mocked(getSessionUserId).mockResolvedValueOnce(null);
    await GET(new Request("http://localhost/api/market/search?q=toyota"));
    expect(searchGlobalAssets).toHaveBeenLastCalledWith("toyota", 16, {
      includeUpstream: false,
    });
  });
});
