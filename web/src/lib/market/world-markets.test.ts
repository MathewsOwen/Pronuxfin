import { describe, expect, it } from "vitest";

import { listSectorSymbols } from "@/lib/market/sector-universe";
import {
  DESK_MARKET_ORDER,
  normalizeDeskMarketId,
} from "@/lib/market/world-markets";

describe("world markets desk", () => {
  it("defines 20 global markets including Brazil", () => {
    expect(DESK_MARKET_ORDER).toHaveLength(20);
    expect(DESK_MARKET_ORDER[0]).toBe("br");
    expect(DESK_MARKET_ORDER).toContain("us");
    expect(DESK_MARKET_ORDER).toContain("jp");
    expect(DESK_MARKET_ORDER).toContain("sg");
  });

  it("maps legacy intl region to United States", () => {
    expect(normalizeDeskMarketId("intl")).toBe("us");
    expect(normalizeDeskMarketId("INTL")).toBe("us");
  });

  it("lists sector symbols for Japan with Yahoo suffix", () => {
    const symbols = listSectorSymbols("jp", "technology");
    expect(symbols.length).toBeGreaterThan(0);
    expect(symbols.every((s) => s.endsWith(".T"))).toBe(true);
  });

  it("lists sector symbols for Germany with .DE suffix", () => {
    const symbols = listSectorSymbols("de", "technology");
    expect(symbols).toContain("SAP.DE");
  });

  it("keeps Brazil on BRAPI universe", () => {
    const symbols = listSectorSymbols("br", "commodities");
    expect(symbols).toContain("VALE3");
  });
});
