import { describe, expect, it } from "vitest";

import {
  detectAssetClass,
  detectDeskMarketFromSymbol,
} from "@/lib/market/asset-class";
import { resolveFmpEquitySymbol } from "@/lib/market/fmp-symbol-resolver";
import { isKnownCryptoSymbol } from "@/lib/market/crypto-coin-registry";

describe("asset class routing", () => {
  it("detects crypto symbols from registry", () => {
    expect(isKnownCryptoSymbol("BTC")).toBe(true);
    expect(detectAssetClass("BTC")).toBe("crypto");
    expect(detectAssetClass("ETH")).toBe("crypto");
  });

  it("detects desk markets from exchange suffix", () => {
    expect(detectDeskMarketFromSymbol("SAP.DE")).toBe("de");
    expect(detectDeskMarketFromSymbol("7203.T")).toBe("jp");
    expect(detectDeskMarketFromSymbol("0700.HK")).toBe("hk");
    expect(detectDeskMarketFromSymbol("PETR4")).toBe("br");
    expect(detectDeskMarketFromSymbol("AAPL")).toBe("us");
  });

  it("resolves FMP symbols per market", () => {
    expect(resolveFmpEquitySymbol("PETR4", "br")).toBe("PETR4.SA");
    expect(resolveFmpEquitySymbol("SAP.DE", "de")).toBe("SAP.DE");
    expect(resolveFmpEquitySymbol("AAPL", "us")).toBe("AAPL");
  });
});
