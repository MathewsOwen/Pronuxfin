import type {
  AssetDividendEvent,
  AssetDividendInsights,
  AssetHistoryPoint,
  DividendTypeFilter,
  DividendYearYield,
} from "@/lib/market/types";

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function readDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const time = Date.parse(trimmed);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

export function parseBrapiDividendEvents(row: Record<string, unknown>): AssetDividendEvent[] {
  const root = row.dividendsData;
  if (!root || typeof root !== "object") return [];
  const cash = (root as Record<string, unknown>).cashDividends;
  if (!Array.isArray(cash)) return [];

  const events: AssetDividendEvent[] = [];
  for (const item of cash) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const amount = readNumber(r.rate);
    if (amount == null || amount <= 0) continue;
    const label = typeof r.label === "string" ? r.label.trim() : "DIVIDENDO";
    events.push({
      paymentDate: readDate(r.paymentDate),
      exDate: readDate(r.lastDatePrior),
      recordDate: readDate(r.approvedOn),
      amount,
      type: normalizeDividendType(label),
      label,
    });
  }
  return events;
}

export function parseFmpDividendEvents(rows: Array<Record<string, unknown>>): AssetDividendEvent[] {
  const events: AssetDividendEvent[] = [];
  for (const r of rows) {
    const amount =
      readNumber(r.adjDividend) ?? readNumber(r.dividend) ?? readNumber(r.amount);
    if (amount == null || amount <= 0) continue;
    events.push({
      paymentDate: readDate(r.paymentDate) ?? readDate(r.date),
      exDate: readDate(r.recordDate),
      recordDate: readDate(r.recordDate),
      amount,
      type: "DIVIDEND",
      label: typeof r.label === "string" ? r.label : "Cash dividend",
    });
  }
  return events;
}

function normalizeDividendType(label: string) {
  const upper = label.toUpperCase();
  if (upper.includes("JCP")) return "JCP";
  if (upper.includes("REND")) return "INCOME";
  if (upper.includes("DIVID")) return "DIVIDEND";
  return upper.slice(0, 24) || "DIVIDEND";
}

export function filterDividendEvents(
  events: AssetDividendEvent[],
  filter: DividendTypeFilter,
): AssetDividendEvent[] {
  if (filter === "ALL") return events;
  return events.filter((e) => e.type === filter);
}

export function computeDividendYieldByYear(
  events: AssetDividendEvent[],
  history: AssetHistoryPoint[],
): DividendYearYield[] {
  const yearEndPrice = new Map<number, number>();
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  for (const p of sortedHistory) {
    yearEndPrice.set(new Date(p.date).getUTCFullYear(), p.close);
  }

  const paidByYear = new Map<number, number>();
  for (const e of events) {
    if (!e.paymentDate) continue;
    const y = new Date(e.paymentDate).getUTCFullYear();
    paidByYear.set(y, (paidByYear.get(y) ?? 0) + e.amount);
  }

  return [...paidByYear.entries()]
    .map(([year, totalPaid]) => {
      const price = yearEndPrice.get(year) ?? null;
      const yieldPct =
        price != null && price > 0 ? (totalPaid / price) * 100 : null;
      return { year, totalPaid, yieldPct, yearEndPrice: price };
    })
    .sort((a, b) => a.year - b.year);
}

export function aggregateDividendsByYear(events: AssetDividendEvent[]) {
  const map = new Map<number, { total: number; count: number }>();
  for (const e of events) {
    if (!e.paymentDate) continue;
    const y = new Date(e.paymentDate).getUTCFullYear();
    const bucket = map.get(y) ?? { total: 0, count: 0 };
    bucket.total += e.amount;
    bucket.count += 1;
    map.set(y, bucket);
  }
  return [...map.entries()]
    .map(([year, row]) => ({ year, total: row.total, count: row.count }))
    .sort((a, b) => a.year - b.year);
}

export function buildAssetDividendInsights(
  events: AssetDividendEvent[],
  sourceLabel: string,
  currentPrice: number | null,
  dividendYieldSnapshot: number | null,
  history: AssetHistoryPoint[] = [],
): AssetDividendInsights {
  const sorted = [...events].sort((a, b) => {
    const ta = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
    const tb = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
    return tb - ta;
  });

  const now = Date.now();
  const yearMs = 365 * 86_400_000;
  const last12m = sorted.filter((e) => {
    if (!e.paymentDate) return false;
    return now - new Date(e.paymentDate).getTime() <= yearMs;
  });
  const last24m = sorted.filter((e) => {
    if (!e.paymentDate) return false;
    return now - new Date(e.paymentDate).getTime() <= 2 * yearMs;
  });

  const trailing12mTotal = last12m.reduce((sum, e) => sum + e.amount, 0);
  const trailing12mYield =
    currentPrice != null && currentPrice > 0 && trailing12mTotal > 0
      ? (trailing12mTotal / currentPrice) * 100
      : null;

  const byYear = aggregateDividendsByYear(sorted).sort((a, b) => b.year - a.year);
  const yieldByYear = computeDividendYieldByYear(sorted, history);

  const upcoming = sorted
    .filter((e) => e.paymentDate && new Date(e.paymentDate).getTime() >= now)
    .sort((a, b) => new Date(a.paymentDate!).getTime() - new Date(b.paymentDate!).getTime());

  return {
    sourceLabel,
    events: sorted.slice(0, 120),
    trailing12mTotal: trailing12mTotal > 0 ? trailing12mTotal : null,
    trailing12mYield,
    paymentsLast12m: last12m.length,
    paymentsLast24m: last24m.length,
    byYear: byYear.slice(0, 12),
    yieldByYear: yieldByYear.slice(-12),
    nextPayment: upcoming[0] ?? null,
    dividendYieldSnapshot,
  };
}

export function dividendInsightsHasData(insights: AssetDividendInsights): boolean {
  return (
    insights.events.length > 0 ||
    insights.trailing12mTotal != null ||
    insights.dividendYieldSnapshot != null
  );
}
