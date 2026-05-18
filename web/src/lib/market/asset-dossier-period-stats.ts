import type { AssetDossierPeriodStats, AssetHistoryPoint } from "@/lib/market/types";

const TRADING_DAYS_YEAR = 252;

function sortedUniqueDays(history: AssetHistoryPoint[]): AssetHistoryPoint[] {
  const byDay = new Map<string, AssetHistoryPoint>();
  for (const p of history) {
    byDay.set(p.date.slice(0, 10), p);
  }
  return [...byDay.values()].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

function returnBetween(series: AssetHistoryPoint[], startIndex: number, endIndex: number): number | null {
  const start = series[startIndex]?.close;
  const end = series[endIndex]?.close;
  if (start == null || end == null || start <= 0) return null;
  return ((end - start) / start) * 100;
}

function indexAtOrBefore(series: AssetHistoryPoint[], targetMs: number): number {
  let lo = 0;
  let hi = series.length - 1;
  let best = 0;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const t = new Date(series[mid]!.date).getTime();
    if (t <= targetMs) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

function periodReturn(series: AssetHistoryPoint[], calendarDays: number): number | null {
  if (series.length < 2) return null;
  const endIdx = series.length - 1;
  const endMs = new Date(series[endIdx]!.date).getTime();
  const startMs = endMs - calendarDays * 86_400_000;
  const startIdx = indexAtOrBefore(series, startMs);
  if (startIdx >= endIdx) return null;
  return returnBetween(series, startIdx, endIdx);
}

function ytdReturn(series: AssetHistoryPoint[]): number | null {
  if (series.length < 2) return null;
  const endIdx = series.length - 1;
  const endYear = new Date(series[endIdx]!.date).getUTCFullYear();
  let startIdx = endIdx;
  for (let i = series.length - 1; i >= 0; i--) {
    if (new Date(series[i]!.date).getUTCFullYear() === endYear) startIdx = i;
    else break;
  }
  if (startIdx >= endIdx) return null;
  return returnBetween(series, startIdx, endIdx);
}

function maxDrawdownPct(series: AssetHistoryPoint[]): number | null {
  if (series.length < 2) return null;
  let peak = series[0]!.close;
  let worst = 0;
  for (const p of series) {
    if (p.close > peak) peak = p.close;
    if (peak > 0) {
      const dd = ((p.close - peak) / peak) * 100;
      if (dd < worst) worst = dd;
    }
  }
  return worst < 0 ? worst : null;
}

function annualizedVolatilityPct(series: AssetHistoryPoint[]): number | null {
  const returns: number[] = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1]!.close;
    const cur = series[i]!.close;
    if (prev > 0 && Number.isFinite(cur)) {
      returns.push((cur - prev) / prev);
    }
  }
  if (returns.length < 5) return null;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((acc, r) => acc + (r - mean) ** 2, 0) / Math.max(returns.length - 1, 1);
  const dailyStd = Math.sqrt(variance);
  return dailyStd * Math.sqrt(TRADING_DAYS_YEAR) * 100;
}

function avgVolumeLastN(series: AssetHistoryPoint[], n: number): number | null {
  const tail = series.slice(-n);
  const volumes = tail.map((p) => p.volume).filter((v): v is number => v != null && Number.isFinite(v));
  if (volumes.length < Math.min(5, n)) return null;
  return volumes.reduce((a, b) => a + b, 0) / volumes.length;
}

function distanceFromLevel(current: number | null, level: number | null): number | null {
  if (current == null || level == null || !Number.isFinite(current) || !Number.isFinite(level) || level <= 0) {
    return null;
  }
  return ((current - level) / level) * 100;
}

export function computeAssetDossierPeriodStats(
  history: AssetHistoryPoint[],
  currentPrice: number | null,
  fiftyTwoWeekHigh: number | null,
  fiftyTwoWeekLow: number | null,
): AssetDossierPeriodStats {
  const series = sortedUniqueDays(history);
  if (series.length < 2) {
    return {
      ytd: null,
      oneMonth: null,
      threeMonths: null,
      sixMonths: null,
      oneYear: null,
      threeYears: null,
      fiveYears: null,
      sinceWindowStart: null,
      maxDrawdownPct: null,
      annualizedVolatilityPct: null,
      avgVolume20d: null,
      distanceFrom52WeekHighPct: null,
      distanceFrom52WeekLowPct: null,
      windowTradingDays: series.length,
    };
  }

  const price = currentPrice ?? series.at(-1)?.close ?? null;

  return {
    ytd: ytdReturn(series),
    oneMonth: periodReturn(series, 30),
    threeMonths: periodReturn(series, 90),
    sixMonths: periodReturn(series, 180),
    oneYear: periodReturn(series, 365),
    threeYears: periodReturn(series, 365 * 3),
    fiveYears: periodReturn(series, 365 * 5),
    sinceWindowStart: returnBetween(series, 0, series.length - 1),
    maxDrawdownPct: maxDrawdownPct(series),
    annualizedVolatilityPct: annualizedVolatilityPct(series),
    avgVolume20d: avgVolumeLastN(series, 20),
    distanceFrom52WeekHighPct: distanceFromLevel(price, fiftyTwoWeekHigh),
    distanceFrom52WeekLowPct: distanceFromLevel(price, fiftyTwoWeekLow),
    windowTradingDays: series.length,
  };
}
