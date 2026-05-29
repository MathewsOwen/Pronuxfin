import { afterEach, describe, expect, it, vi } from "vitest";
import { lookupSymbolQuotesBatch } from "./lookup-symbol-quotes-batch";

vi.mock("@/lib/market/equities-brapi", () => ({
  fetchBrapiQuotesForSymbols: vi.fn(),
}));

vi.mock("@/lib/market/equities-yahoo-quote", () => ({
  fetchYahooQuotesForSymbols: vi.fn(),
}));

import { fetchBrapiQuotesForSymbols } from "@/lib/market/equities-brapi";
import { fetchYahooQuotesForSymbols } from "@/lib/market/equities-yahoo-quote";

describe("lookupSymbolQuotesBatch", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("calls BRAPI once for BR symbols and Yahoo once for intl", async () => {
    vi.mocked(fetchBrapiQuotesForSymbols).mockResolvedValue({
      rows: [
        {
          symbol: "PETR4",
          currency: "BRL",
          regularMarketPrice: 10,
          regularMarketChange: null,
          regularMarketChangePercent: null,
          segment: "equity",
        },
      ],
      simulated: false,
      partial: false,
    });
    vi.mocked(fetchYahooQuotesForSymbols).mockResolvedValue({
      rows: [
        {
          symbol: "AAPL",
          currency: "USD",
          regularMarketPrice: 200,
          regularMarketChange: null,
          regularMarketChangePercent: null,
          segment: "equity",
        },
      ],
      simulated: false,
      partial: false,
    });

    const { results } = await lookupSymbolQuotesBatch(["PETR4", "AAPL", "VALE3"]);

    expect(fetchBrapiQuotesForSymbols).toHaveBeenCalledTimes(1);
    expect(fetchBrapiQuotesForSymbols).toHaveBeenCalledWith(
      ["PETR4", "VALE3"],
      { sortOrder: ["PETR4", "VALE3"] },
    );
    expect(fetchYahooQuotesForSymbols).toHaveBeenCalledTimes(1);
    expect(fetchYahooQuotesForSymbols).toHaveBeenCalledWith(["AAPL"], ["AAPL"]);

    expect(results).toHaveLength(3);
    expect(results.find((r) => r.symbol === "PETR4")?.quote?.regularMarketPrice).toBe(10);
    expect(results.find((r) => r.symbol === "AAPL")?.quote?.regularMarketPrice).toBe(200);
  });
});
