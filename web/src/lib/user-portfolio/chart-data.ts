import { loadAssetDossier } from "@/lib/market/load-asset-dossier";
import type { AssetHistoryPoint } from "@/lib/market/types";
import type { PortfolioPositionSnapshot } from "@/lib/user-portfolio/snapshot";

export type PortfolioFlowPoint = {
  label: string;
  value: number;
};

export type PortfolioAllocationSlice = {
  symbol: string;
  label: string;
  value: number;
};

const CHART_COLORS = [
  "oklch(0.72 0.11 165)",
  "oklch(0.7 0.12 85)",
  "oklch(0.68 0.1 250)",
  "oklch(0.65 0.14 25)",
  "oklch(0.62 0.08 300)",
  "oklch(0.58 0.06 200)",
];

export function allocationColors(count: number): string[] {
  return Array.from({ length: count }, (_, i) => CHART_COLORS[i % CHART_COLORS.length]!);
}

export async function buildPortfolioChartData(
  snapshots: PortfolioPositionSnapshot[],
  locale: string,
): Promise<{
  flowSeries: PortfolioFlowPoint[];
  allocation: PortfolioAllocationSlice[];
}> {
  const withValue = snapshots.filter(
    (s) => s.marketValue != null && Number.isFinite(s.marketValue) && s.marketValue > 0,
  );

  const allocation = withValue
    .map((s) => ({
      symbol: s.position.symbol,
      label: s.companyName !== s.position.symbol ? `${s.position.symbol}` : s.position.symbol,
      value: s.marketValue!,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  if (withValue.length === 0) {
    return { flowSeries: [], allocation: [] };
  }

  const top = withValue.slice(0, 6);
  const histories = await Promise.all(
    top.map(async (snap) => ({
      symbol: snap.position.symbol,
      quantity: snap.position.quantity,
      points: (await loadAssetDossier(snap.position.symbol))?.history ?? [],
    })),
  );

  const dateKeys = new Set<string>();
  for (const h of histories) {
    for (const p of h.points.slice(-90)) {
      dateKeys.add(p.date.slice(0, 10));
    }
  }

  const sortedDates = [...dateKeys].sort();
  const sampleDates =
    sortedDates.length <= 14
      ? sortedDates
      : sortedDates.filter((_, i) => i % Math.ceil(sortedDates.length / 14) === 0).slice(-14);

  const flowSeries: PortfolioFlowPoint[] = [];

  for (const dateKey of sampleDates) {
    let total = 0;
    for (const h of histories) {
      const point = findHistoryOnDate(h.points, dateKey);
      if (point?.close != null) {
        total += h.quantity * point.close;
      }
    }
    if (total > 0) {
      const d = new Date(`${dateKey}T12:00:00Z`);
      flowSeries.push({
        label: new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(d),
        value: total,
      });
    }
  }

  return { flowSeries, allocation };
}

function findHistoryOnDate(
  points: AssetHistoryPoint[],
  dateKey: string,
): AssetHistoryPoint | undefined {
  return points.find((p) => p.date.startsWith(dateKey));
}
