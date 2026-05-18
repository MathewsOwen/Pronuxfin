import type { EconomicCalendarEvent } from "@/lib/tools/economic-calendar";

/** Janelas típicas de divulgação trimestral na B3 (aprox. regra CVM — confirmar no RI). */
type ReportingWindow = {
  id: string;
  windowStart: string;
  windowEnd: string;
  quarterPt: string;
  quarterEn: string;
};

function padDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function isoDate(year: number, month: number, day: number) {
  return padDate(new Date(Date.UTC(year, month - 1, day)));
}

function reportingWindowsForYear(year: number): ReportingWindow[] {
  return [
    {
      id: `q4-${year - 1}`,
      windowStart: isoDate(year, 2, 10),
      windowEnd: isoDate(year, 4, 30),
      quarterPt: `4T${year - 1}`,
      quarterEn: `Q4 ${year - 1}`,
    },
    {
      id: `q1-${year}`,
      windowStart: isoDate(year, 5, 10),
      windowEnd: isoDate(year, 7, 31),
      quarterPt: `1T${year}`,
      quarterEn: `Q1 ${year}`,
    },
    {
      id: `q2-${year}`,
      windowStart: isoDate(year, 8, 10),
      windowEnd: isoDate(year, 10, 31),
      quarterPt: `2T${year}`,
      quarterEn: `Q2 ${year}`,
    },
    {
      id: `q3-${year}`,
      windowStart: isoDate(year, 11, 10),
      windowEnd: isoDate(year, 12, 28),
      quarterPt: `3T${year}`,
      quarterEn: `Q3 ${year}`,
    },
  ];
}

function isB3Ticker(symbol: string) {
  return /\d$/.test(symbol.trim());
}

function symbolOffsetInWindow(symbol: string, windowDays: number) {
  if (windowDays <= 1) return 0;
  let hash = 0;
  for (let i = 0; i < symbol.length; i += 1) {
    hash = (hash * 31 + symbol.charCodeAt(i)) >>> 0;
  }
  return hash % windowDays;
}

function daysBetweenInclusive(startIso: string, endIso: string) {
  const start = new Date(`${startIso}T00:00:00Z`).getTime();
  const end = new Date(`${endIso}T00:00:00Z`).getTime();
  return Math.max(1, Math.floor((end - start) / 86_400_000) + 1);
}

function pickEventDate(symbol: string, window: ReportingWindow) {
  const span = daysBetweenInclusive(window.windowStart, window.windowEnd);
  const offset = symbolOffsetInWindow(symbol, span);
  const start = new Date(`${window.windowStart}T00:00:00Z`);
  return padDate(new Date(start.getTime() + offset * 86_400_000));
}

function windowOverlapsHorizon(
  window: ReportingWindow,
  horizonStart: Date,
  horizonEnd: Date,
) {
  const wStart = new Date(`${window.windowStart}T00:00:00Z`).getTime();
  const wEnd = new Date(`${window.windowEnd}T23:59:59Z`).getTime();
  const hStart = horizonStart.getTime();
  const hEnd = horizonEnd.getTime();
  return wEnd >= hStart && wStart <= hEnd;
}

/**
 * Estima janelas de resultados para tickers B3 sem data FMP.
 * Não substitui calendário oficial de RI/CVM.
 */
export function buildB3EarningsSeasonEvents(
  symbols: string[],
  options?: { from?: Date; days?: number },
): EconomicCalendarEvent[] {
  const from = options?.from ?? new Date();
  const days = Math.max(1, Math.min(options?.days ?? 21, 45));
  const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const end = new Date(start.getTime() + days * 86_400_000);

  const unique = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(isB3Ticker))].slice(
    0,
    24,
  );

  const years = [start.getUTCFullYear(), start.getUTCFullYear() + 1];
  const windows = years.flatMap((y) => reportingWindowsForYear(y));

  const out: EconomicCalendarEvent[] = [];

  for (const symbol of unique) {
    for (const window of windows) {
      if (!windowOverlapsHorizon(window, start, end)) continue;
      const date = pickEventDate(symbol, window);
      const eventDate = new Date(`${date}T00:00:00Z`);
      if (eventDate < start || eventDate > end) continue;

      out.push({
        id: `b3-season-${symbol}-${window.id}`,
        date,
        timeUtc: "21:00",
        titlePt: `Temporada de resultados ${window.quarterPt} — ${symbol}`,
        titleEn: `${window.quarterEn} earnings season — ${symbol}`,
        region: "br",
        impact: "medium",
        category: "earnings",
        watchlistSymbol: symbol,
        source: "b3-season",
      });
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}
