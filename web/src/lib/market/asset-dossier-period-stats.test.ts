import { describe, expect, it } from "vitest";

import { computeAssetDossierPeriodStats } from "@/lib/market/asset-dossier-period-stats";
import type { AssetHistoryPoint } from "@/lib/market/types";

function series(closes: number[]): AssetHistoryPoint[] {
  const start = Date.UTC(2024, 0, 2);
  return closes.map((close, i) => ({
    date: new Date(start + i * 86_400_000).toISOString(),
    close,
    volume: 1_000_000,
  }));
}

describe("computeAssetDossierPeriodStats", () => {
  it("computes window return and drawdown", () => {
    const history = series([100, 110, 105, 120, 90, 115]);
    const stats = computeAssetDossierPeriodStats(history, 115, 120, 90);
    expect(stats.sinceWindowStart).toBeCloseTo(15, 0);
    expect(stats.maxDrawdownPct).toBeLessThan(0);
    expect(stats.windowTradingDays).toBe(6);
    expect(stats.annualizedVolatilityPct).not.toBeNull();
  });

  it("returns empty stats for short history", () => {
    const stats = computeAssetDossierPeriodStats([], null, null, null);
    expect(stats.oneYear).toBeNull();
    expect(stats.windowTradingDays).toBe(0);
  });
});
