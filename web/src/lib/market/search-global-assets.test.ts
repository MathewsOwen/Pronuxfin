import { describe, expect, it } from "vitest";

import {
  mapExchangeToDeskMarket,
  normalizeFmpSymbolForDesk,
} from "@/lib/market/exchange-to-desk-market";
import { searchLocalUniverse } from "@/lib/market/search-local-universe";

describe("global asset search helpers", () => {
  it("normalizes FMP Brazil symbols", () => {
    expect(normalizeFmpSymbolForDesk("PETR4.SA")).toBe("PETR4");
    expect(normalizeFmpSymbolForDesk("SAP.DE")).toBe("SAP.DE");
  });

  it("maps exchanges to desk markets", () => {
    expect(mapExchangeToDeskMarket("NASDAQ", "AAPL")).toBe("us");
    expect(mapExchangeToDeskMarket("B3", "VALE3")).toBe("br");
    expect(mapExchangeToDeskMarket("JPX", "7203.T")).toBe("jp");
  });

  it("finds local crypto by name", () => {
    const hits = searchLocalUniverse("bitcoin");
    expect(hits.some((h) => h.symbol === "BTC")).toBe(true);
  });

  it("finds local equities by ticker prefix", () => {
    const hits = searchLocalUniverse("PETR");
    expect(hits.some((h) => h.symbol === "PETR4")).toBe(true);
  });
});
