import { describe, expect, it } from "vitest";

import {
  collectDeskQuotes,
  filterDeskQuotesForSearch,
  findDeskQuote,
} from "./portfolio-live-search";
import type { QuotesPayload } from "./types";

const samplePayload: QuotesPayload = {
  fetchedAt: Date.now(),
  results: [
    {
      symbol: "PETR4",
      shortName: "Petrobras",
      regularMarketPrice: 38.2,
      regularMarketChange: 0.5,
      regularMarketChangePercent: 1.2,
    },
    { symbol: "VALE3", shortName: "Vale", regularMarketPrice: 62, regularMarketChange: -1, regularMarketChangePercent: -1.5 },
  ],
  crypto: [
    {
      symbol: "BTC",
      shortName: "Bitcoin",
      regularMarketPrice: 500000,
      regularMarketChange: 1000,
      regularMarketChangePercent: 0.2,
      segment: "crypto",
    },
  ],
};

describe("portfolio-live-search", () => {
  it("merges equities and crypto from desk payload", () => {
    expect(collectDeskQuotes(samplePayload)).toHaveLength(3);
  });

  it("filters by symbol or name", () => {
    const quotes = collectDeskQuotes(samplePayload);
    expect(filterDeskQuotesForSearch(quotes, "petr").map((q) => q.symbol)).toEqual(["PETR4"]);
    expect(filterDeskQuotesForSearch(quotes, "bitcoin")[0]?.symbol).toBe("BTC");
  });

  it("finds exact symbol in desk book", () => {
    const quotes = collectDeskQuotes(samplePayload);
    expect(findDeskQuote(quotes, "vale3")?.shortName).toBe("Vale");
  });
});
