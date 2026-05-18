import type {
  AssetDossierHistoricalInsights,
  AssetHistoryPoint,
  CalendarYearReturn,
  CalendarYearVolume,
} from "@/lib/market/types";

const MIN_DAYS_IN_YEAR = 2;
const MIN_SPAN_DAYS_FOR_CONFIDENCE = 400;

function emptyInsights(historyDepthLimited: boolean): AssetDossierHistoricalInsights {
  return {
    historyDepthLimited,
    calendarYearReturns: [],
    bestCalendarYear: null,
    worstCalendarYear: null,
    negativeReturnYears: [],
    topVolumeYears: [],
    volumeDataPartial: false,
  };
}

/**
 * Agrega retorno por ano civil (primeiro vs último fechamento do ano na série)
 * e volumes anuais. Depende da janela de histórico carregada no dossiê.
 */
export function computeAssetDossierHistoricalInsights(
  history: AssetHistoryPoint[],
): AssetDossierHistoricalInsights {
  if (history.length < 2) {
    return emptyInsights(true);
  }

  const sorted = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const byDay = new Map<string, AssetHistoryPoint>();
  for (const p of sorted) {
    const key = p.date.slice(0, 10);
    byDay.set(key, p);
  }
  const series = [...byDay.values()].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  if (series.length < 2) {
    return emptyInsights(true);
  }

  const yearPoints = new Map<number, AssetHistoryPoint[]>();
  for (const p of series) {
    const y = new Date(p.date).getUTCFullYear();
    const bucket = yearPoints.get(y);
    if (bucket) bucket.push(p);
    else yearPoints.set(y, [p]);
  }

  const calendarYearReturns: CalendarYearReturn[] = [];
  for (const [year, points] of [...yearPoints.entries()].sort((a, b) => a[0] - b[0])) {
    if (points.length < MIN_DAYS_IN_YEAR) continue;
    const first = points[0]!;
    const last = points[points.length - 1]!;
    if (first.close <= 0) continue;
    const returnPct = ((last.close - first.close) / first.close) * 100;
    calendarYearReturns.push({ year, returnPct });
  }

  const volumeByYear = new Map<number, number>();
  let volumeDataPartial = false;
  for (const p of series) {
    const y = new Date(p.date).getUTCFullYear();
    if (p.volume == null || !Number.isFinite(p.volume)) {
      volumeDataPartial = true;
      continue;
    }
    volumeByYear.set(y, (volumeByYear.get(y) ?? 0) + p.volume);
  }

  const topVolumeYears: CalendarYearVolume[] = [...volumeByYear.entries()]
    .map(([year, totalVolume]) => ({ year, totalVolume }))
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, 3);

  let bestCalendarYear: CalendarYearReturn | null = null;
  let worstCalendarYear: CalendarYearReturn | null = null;
  for (const row of calendarYearReturns) {
    if (!bestCalendarYear || row.returnPct > bestCalendarYear.returnPct) {
      bestCalendarYear = row;
    }
    if (!worstCalendarYear || row.returnPct < worstCalendarYear.returnPct) {
      worstCalendarYear = row;
    }
  }

  const negativeReturnYears = calendarYearReturns
    .filter((c) => c.returnPct < 0)
    .map((c) => c.year)
    .sort((a, b) => b - a);

  const spanMs =
    new Date(series[series.length - 1]!.date).getTime() - new Date(series[0]!.date).getTime();
  const spanDays = spanMs / 86_400_000;
  const historyDepthLimited = spanDays < MIN_SPAN_DAYS_FOR_CONFIDENCE;

  return {
    historyDepthLimited,
    calendarYearReturns: [...calendarYearReturns].sort((a, b) => b.year - a.year),
    bestCalendarYear,
    worstCalendarYear,
    negativeReturnYears,
    topVolumeYears,
    volumeDataPartial,
  };
}
