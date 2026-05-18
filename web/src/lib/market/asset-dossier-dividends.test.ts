import { describe, expect, it } from "vitest";

import {
  buildAssetDividendInsights,
  dividendInsightsHasData,
} from "@/lib/market/asset-dossier-dividends";

describe("buildAssetDividendInsights", () => {
  it("aggregates trailing 12m and by year", () => {
    const now = Date.now();
    const events = [
      {
        paymentDate: new Date(now - 30 * 86_400_000).toISOString(),
        exDate: null,
        recordDate: null,
        amount: 1,
        type: "DIVIDEND",
      },
      {
        paymentDate: new Date(now - 400 * 86_400_000).toISOString(),
        exDate: null,
        recordDate: null,
        amount: 2,
        type: "DIVIDEND",
      },
    ];
    const ins = buildAssetDividendInsights(events, "test", 100, 0.05);
    expect(ins.trailing12mTotal).toBe(1);
    expect(ins.paymentsLast12m).toBe(1);
    expect(dividendInsightsHasData(ins)).toBe(true);
  });
});
