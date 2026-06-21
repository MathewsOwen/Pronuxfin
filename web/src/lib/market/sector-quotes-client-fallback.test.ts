import { describe, expect, it } from "vitest";
import {
  buildSkeletonQuoteRows,
  sectorBookIsLoading,
  sectorDeskPlaceholderPayload,
} from "@/lib/market/sector-quotes-client-fallback";

describe("sector-quotes-client-fallback", () => {
  it("placeholder renders tickers immediately without prices", () => {
    const symbols = ["PETR4", "VALE3", "ITUB4"];
    const payload = sectorDeskPlaceholderPayload("br", "energy", symbols);

    expect(payload.fetchedAt).toBe(0);
    expect(payload.results).toHaveLength(3);
    expect(payload.results.map((r) => r.symbol)).toEqual(symbols);
    expect(payload.results.every((r) => r.regularMarketPrice == null)).toBe(true);
    expect(sectorBookIsLoading(payload)).toBe(true);
  });

  it("buildSkeletonQuoteRows preserves order", () => {
    const rows = buildSkeletonQuoteRows(["A", "B"]);
    expect(rows.map((r) => r.symbol)).toEqual(["A", "B"]);
  });
});
