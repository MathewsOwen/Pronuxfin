import {
  canUseMarketProvider,
  noteMarketProviderUsage,
} from "@/lib/market/market-provider-budget";
import { rememberWithTtl } from "@/lib/market/market-server-cache";
import type { EconomicCalendarEvent } from "@/lib/tools/economic-calendar";

type FmpEarningRow = {
  symbol?: string;
  date?: string;
  time?: string;
  eps?: number | null;
  epsEstimated?: number | null;
  revenue?: number | null;
  revenueEstimated?: number | null;
};

const FMP_EARNINGS_TTL_MS = 15 * 60_000;

function fmpEnabled() {
  const toggle = process.env.MARKET_PROVIDER_FMP_ENABLED?.trim().toLowerCase();
  if (toggle === "0" || toggle === "false" || toggle === "no" || toggle === "off") {
    return false;
  }
  const apiKey =
    process.env.FMP_API_KEY?.trim() ||
    process.env.FINANCIAL_MODELING_PREP_API_KEY?.trim() ||
    "";
  return Boolean(apiKey) && canUseMarketProvider("financial_modeling_prep");
}

function padDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function fetchFmpEarningsCalendarRaw(
  fromIso: string,
  toIso: string,
): Promise<FmpEarningRow[] | null> {
  if (!fmpEnabled()) return null;

  const apiKey =
    process.env.FMP_API_KEY?.trim() ||
    process.env.FINANCIAL_MODELING_PREP_API_KEY?.trim() ||
    "";

  try {
    const url = `https://financialmodelingprep.com/api/v3/earning_calendar?from=${encodeURIComponent(
      fromIso,
    )}&to=${encodeURIComponent(toIso)}&apikey=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "PRONUXFIN/1.0 (+https://pronuxfin.com.br; institutional economic calendar)",
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`fmp_earnings_status_${res.status}`);
    const json = (await res.json()) as FmpEarningRow[];
    if (!Array.isArray(json)) return null;
    noteMarketProviderUsage("financial_modeling_prep");
    return json;
  } catch {
    return null;
  }
}

function readEps(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function mapRowToEvent(
  row: FmpEarningRow,
  watchlistSet: Set<string> | null,
): EconomicCalendarEvent | null {
  const symbol = typeof row.symbol === "string" ? row.symbol.trim().toUpperCase() : "";
  const date =
    typeof row.date === "string" && row.date.length >= 10 ? row.date.slice(0, 10) : "";
  if (!symbol || !date) return null;

  if (watchlistSet && !watchlistSet.has(symbol)) return null;

  const region = /\d$/.test(symbol) ? ("br" as const) : ("global" as const);
  const epsActual = readEps(row.eps);
  const epsEstimated = readEps(row.epsEstimated);

  return {
    id: `fmp-earnings-${symbol}-${date}`,
    date,
    timeUtc: typeof row.time === "string" && row.time ? row.time : "20:00",
    titlePt: `Divulgação de resultados — ${symbol}`,
    titleEn: `Earnings release — ${symbol}`,
    region,
    impact: "high",
    category: "earnings",
    watchlistSymbol: watchlistSet?.has(symbol) ? symbol : undefined,
    source: "fmp",
    epsActual,
    epsEstimated,
  };
}

export function mapFmpEarningsToCalendarEvents(
  rows: FmpEarningRow[],
  watchlistSymbols?: string[],
): EconomicCalendarEvent[] {
  const watchlistSet =
    watchlistSymbols && watchlistSymbols.length > 0
      ? new Set(watchlistSymbols.map((s) => s.trim().toUpperCase()).filter(Boolean))
      : null;

  const out: EconomicCalendarEvent[] = [];
  for (const row of rows) {
    const ev = mapRowToEvent(row, watchlistSet);
    if (ev) out.push(ev);
  }
  return out;
}

export async function fetchFmpEarningsCalendarEvents(options: {
  days: number;
  watchlistSymbols?: string[];
  /** Sem watchlist: limita ruído na vista pública. */
  publicLimit?: number;
}): Promise<{ events: EconomicCalendarEvent[]; available: boolean }> {
  const days = Math.max(1, Math.min(options.days, 45));
  const from = new Date();
  const start = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );
  const end = new Date(start.getTime() + days * 86_400_000);
  const fromIso = padDate(start);
  const toIso = padDate(end);
  const cacheKey = `fmp-earnings:${fromIso}:${toIso}:${options.watchlistSymbols?.join(",") ?? "all"}`;

  return rememberWithTtl(cacheKey, FMP_EARNINGS_TTL_MS, async () => {
    const raw = await fetchFmpEarningsCalendarRaw(fromIso, toIso);
    if (!raw) return { events: [], available: false };

    let rows = raw;
    if (!options.watchlistSymbols?.length && options.publicLimit != null) {
      rows = raw.slice(0, options.publicLimit);
    }

    return {
      events: mapFmpEarningsToCalendarEvents(rows, options.watchlistSymbols),
      available: true,
    };
  });
}
