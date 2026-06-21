import { describe, expect, it } from "vitest";

import { listSectorSymbols, SECTOR_ORDER } from "@/lib/market/sector-universe";
import {
  DESK_MARKET_ORDER,
  listWorldMarketHeadlineTickers,
  normalizeDeskMarketId,
  WORLD_MARKET_HEADLINE_TICKERS,
} from "@/lib/market/world-markets";

function uniqueWorldMarketSymbolCount(market: string): number {
  const symbols = SECTOR_ORDER.flatMap((sector) => listSectorSymbols(market, sector));
  return new Set(symbols).size;
}

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

  it("lists more tickers than the old sparse universes (~45) per country", () => {
    const worldMarkets = DESK_MARKET_ORDER.filter((id) => id !== "br" && id !== "us");
    for (const market of worldMarkets) {
      const count = uniqueWorldMarketSymbolCount(market);
      const small =
        market === "ch" ||
        market === "sg" ||
        market === "nl" ||
        market === "se" ||
        market === "it" ||
        market === "es";
      const floor = small ? 25 : market === "tw" ? 35 : 45;
      expect(count, `${market} universe`).toBeGreaterThanOrEqual(floor);
    }
  });

  it("lists at least 5–8 tickers per sector depending on market depth", () => {
    const worldMarkets = DESK_MARKET_ORDER.filter((id) => id !== "br" && id !== "us");
    const smallMarkets = new Set(["ch", "sg", "nl", "it", "es", "se"]);
    const deepMarkets = new Set(["cn", "hk", "jp", "gb", "de", "fr", "in", "kr", "ca", "sa", "au"]);
    for (const market of worldMarkets) {
      const minPerSector = smallMarkets.has(market) ? 6 : deepMarkets.has(market) ? 8 : 5;
      for (const sector of SECTOR_ORDER) {
        expect(
          listSectorSymbols(market, sector).length,
          `${market}/${sector}`,
        ).toBeGreaterThanOrEqual(minPerSector);
      }
    }
  });

  it("lists headline tickers for every non-BR market (ticker tape)", () => {
    const headlines = listWorldMarketHeadlineTickers();
    expect(headlines).toHaveLength(38);
    for (const market of DESK_MARKET_ORDER.filter((id) => id !== "br")) {
      for (const symbol of WORLD_MARKET_HEADLINE_TICKERS[market]) {
        expect(headlines).toContain(symbol);
      }
    }
  });
});
