import { fetchMarket } from "@/lib/http/fetch-with-timeout";
import { sortQuotesByCanonicalOrder } from "@/lib/market/quote-order";
import type { QuoteSnapshot } from "@/lib/market/types";

const YAHOO_CHUNK = 56;
const YAHOO_DOTTED_CONCURRENCY = 8;

function chunk<T>(arr: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function needsIndividualYahooFetch(symbol: string): boolean {
  return /[./]/.test(symbol);
}

function mapYahooRow(row: Record<string, unknown>): QuoteSnapshot | null {
  const symbol = String(row.symbol ?? "").trim().toUpperCase();
  if (!symbol) return null;
  const n = (v: unknown): number | null => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (v != null && v !== "") {
      const x = Number(v);
      return Number.isFinite(x) ? x : null;
    }
    return null;
  };
  const currencyRaw = row.currency;
  const currency =
    typeof currencyRaw === "string" && currencyRaw.trim().length > 0
      ? currencyRaw.trim()
      : "USD";
  return {
    symbol,
    shortName:
      typeof row.shortName === "string"
        ? row.shortName
        : typeof row.longName === "string"
          ? row.longName
          : undefined,
    currency,
    regularMarketPrice: n(row.regularMarketPrice),
    regularMarketChange: n(row.regularMarketChange),
    regularMarketChangePercent: n(row.regularMarketChangePercent),
    marketTime:
      typeof row.regularMarketTime === "number"
        ? new Date(row.regularMarketTime * 1000).toISOString()
        : undefined,
    segment: "equity",
  };
}

function emptyIntlBook(
  canonical: readonly string[],
  warning: string,
): {
  rows: QuoteSnapshot[];
  simulated: boolean;
  partial: boolean;
  warning: string;
} {
  return {
    rows: [],
    simulated: false,
    partial: true,
    warning,
  };
}

async function fetchYahooQuoteBatch(
  batch: readonly string[],
  merged: Map<string, QuoteSnapshot>,
): Promise<void> {
  if (batch.length === 0) return;
  const qs = encodeURIComponent(batch.join(","));
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${qs}`;
  const res = await fetchMarket(url, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (compatible; PRONUXFIN/1.0; +https://pronux.fin) AppleWebKit/537.36",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`intl_quotes_http_${res.status}`);
  }

  const json = (await res.json()) as {
    quoteResponse?: { result?: Array<Record<string, unknown>>; error?: unknown };
  };

  for (const row of json.quoteResponse?.result ?? []) {
    const snap = mapYahooRow(row);
    if (snap) merged.set(snap.symbol, snap);
  }
}

async function runWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<PromiseSettledResult<void>[]> {
  const results: PromiseSettledResult<void>[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const slice = items.slice(i, i + limit);
    const settled = await Promise.allSettled(slice.map((item) => worker(item)));
    results.push(...settled);
  }
  return results;
}

/**
 * Snapshot via agregação Yahoo Finance (endpoint público não documentado oficialmente —
 * em produção comercial avalie provedor licenciado e troque apenas este módulo).
 */
export async function fetchYahooQuotesForSymbols(
  symbolsInput: readonly string[],
  sortOrderHint?: readonly string[],
): Promise<{
  rows: QuoteSnapshot[];
  simulated: boolean;
  partial: boolean;
  warning?: string;
}> {
  const uniq = [...new Set(symbolsInput.map((s) => s.trim().toUpperCase()))].filter(Boolean);
  const canonical = sortOrderHint ?? uniq;
  if (uniq.length === 0) {
    return { rows: [], simulated: false, partial: false };
  }

  const merged = new Map<string, QuoteSnapshot>();
  const batchable = uniq.filter((s) => !needsIndividualYahooFetch(s));
  const dotted = uniq.filter((s) => needsIndividualYahooFetch(s));

  try {
    const batchJobs = chunk(batchable, YAHOO_CHUNK).map((batch) =>
      fetchYahooQuoteBatch(batch, merged),
    );
    const dottedSettled =
      dotted.length > 0
        ? await runWithConcurrency(dotted, YAHOO_DOTTED_CONCURRENCY, (symbol) =>
            fetchYahooQuoteBatch([symbol], merged),
          )
        : [];

    const batchSettled = await Promise.allSettled(batchJobs);
    const settled = [...batchSettled, ...dottedSettled];

    const allFailed = settled.every((result) => result.status === "rejected");
    if (allFailed) {
      return emptyIntlBook(canonical, "intl_quotes_http");
    }
  } catch {
    return emptyIntlBook(canonical, "intl_network");
  }

  const sorted = sortQuotesByCanonicalOrder([...merged.values()], canonical);
  if (sorted.length === 0) {
    return emptyIntlBook(canonical, "intl_empty");
  }

  const partial = sorted.length < uniq.length;
  return {
    rows: sorted,
    simulated: false,
    partial,
    ...(partial ? { warning: "intl_partial" as const } : {}),
  };
}
