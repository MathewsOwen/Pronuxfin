import { describe, expect, it } from "vitest";

import {
  detectWatchlistRegion,
  isValidWatchlistSymbol,
  normalizeWatchlistSymbol,
} from "@/lib/user-watchlist/load";

describe("watchlist symbol helpers", () => {
  it("normalizes to uppercase trimmed", () => {
    expect(normalizeWatchlistSymbol("  petr4  ")).toBe("PETR4");
    expect(normalizeWatchlistSymbol("aapl")).toBe("AAPL");
  });

  it("validates allowed symbol charset and length", () => {
    expect(isValidWatchlistSymbol("PETR4")).toBe(true);
    expect(isValidWatchlistSymbol("BRK.B")).toBe(true);
    expect(isValidWatchlistSymbol("")).toBe(false);
    expect(isValidWatchlistSymbol("TOOLONGSYMBOLNAME")).toBe(false);
    expect(isValidWatchlistSymbol("PETR@4")).toBe(false);
  });

  it("detects BR vs international region", () => {
    expect(detectWatchlistRegion("PETR4")).toBe("br");
    expect(detectWatchlistRegion("VALE3")).toBe("br");
    expect(detectWatchlistRegion("AAPL")).toBe("intl");
    expect(detectWatchlistRegion("MSFT")).toBe("intl");
  });
});
