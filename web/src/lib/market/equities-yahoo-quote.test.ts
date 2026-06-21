import { describe, expect, it } from "vitest";
import { canYahooBatchSymbol } from "@/lib/market/equities-yahoo-quote";

describe("canYahooBatchSymbol", () => {
  it("batches plain US tickers", () => {
    expect(canYahooBatchSymbol("AAPL")).toBe(true);
    expect(canYahooBatchSymbol("NVDA")).toBe(true);
  });

  it("batches global exchange suffix tickers", () => {
    expect(canYahooBatchSymbol("SAP.DE")).toBe(true);
    expect(canYahooBatchSymbol("7203.T")).toBe(true);
    expect(canYahooBatchSymbol("0700.HK")).toBe(true);
    expect(canYahooBatchSymbol("PETR4.SA")).toBe(false);
  });

  it("keeps US class shares individual", () => {
    expect(canYahooBatchSymbol("BRK.B")).toBe(false);
    expect(canYahooBatchSymbol("BF.B")).toBe(false);
  });
});
