import { fetchMarket } from "@/lib/http/fetch-with-timeout";
import { sortQuotesByCanonicalOrder } from "@/lib/market/quote-order";
import type { QuoteSnapshot } from "@/lib/market/types";

/** Yahoo spark aceita até 20 símbolos por request (v7/quote retorna 401). */
const YAHOO_SPARK_CHUNK = 20;
const YAHOO_SPARK_CONCURRENCY = 6;

const YAHOO_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** Sufixos de bolsa globais — Yahoo aceita lote comma-separated (ex.: SAP.DE,BMW.DE). */
const YAHOO_EXCHANGE_SUFFIX =
  /\.(SS|SZ|HK|T|L|DE|PA|NS|TO|SR|SW|AX|KS|AS|TW|ST|MI|MC|SI)$/i;

export function canYahooBatchSymbol(symbol: string): boolean {
  const s = symbol.trim();
  if (!s) return false;
  if (!/[./]/.test(s)) return true;
  return YAHOO_EXCHANGE_SUFFIX.test(s);
}

/** BRK.B → BRK-B (spark); bolsas globais mantêm o sufixo. */
export function yahooSparkSymbol(symbol: string): string {
  const s = symbol.trim().toUpperCase();
  if (/^[A-Z]{1,5}\.[A-Z]$/.test(s) && !YAHOO_EXCHANGE_SUFFIX.test(s)) {
    return s.replace(".", "-");
  }
  return s;
}

function chunk<T>(arr: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function readOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapSparkMeta(row: Record<string, unknown>): QuoteSnapshot | null {
  const symbol = String(row.symbol ?? "").trim().toUpperCase();
  if (!symbol) return null;

  const price = readOptionalNumber(row.regularMarketPrice);
  const previousClose = readOptionalNumber(row.chartPreviousClose);
  let regularMarketChange: number | null = null;
  let regularMarketChangePercent: number | null = null;
  if (price != null && previousClose != null) {
    regularMarketChange = price - previousClose;
    if (previousClose !== 0) {
      regularMarketChangePercent = (regularMarketChange / previousClose) * 100;
    }
  }

  const currencyRaw = row.currency;
  const currency =
    typeof currencyRaw === "string" && currencyRaw.trim().length > 0
      ? currencyRaw.trim()
      : "USD";

  const marketTimeSec = readOptionalNumber(row.regularMarketTime);

  return {
    symbol,
    shortName:
      typeof row.shortName === "string"
        ? row.shortName
        : typeof row.longName === "string"
          ? row.longName
          : undefined,
    currency,
    regularMarketPrice: price,
    regularMarketChange,
    regularMarketChangePercent,
    regularMarketVolume: readOptionalNumber(row.regularMarketVolume),
    marketTime:
      marketTimeSec != null
        ? new Date(marketTimeSec * 1000).toISOString()
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

async function fetchYahooSparkBatch(
  batch: readonly string[],
  merged: Map<string, QuoteSnapshot>,
): Promise<void> {
  if (batch.length === 0) return;
  const sparkSymbols = batch.map(yahooSparkSymbol);
  const qs = encodeURIComponent(sparkSymbols.join(","));
  const url = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${qs}&range=1d&interval=1d`;
  const res = await fetchMarket(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": YAHOO_USER_AGENT,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`intl_quotes_http_${res.status}`);
  }

  const json = (await res.json()) as {
    spark?: {
      result?: Array<{
        symbol?: string;
        response?: Array<{ meta?: Record<string, unknown> }>;
      }>;
      error?: unknown;
    };
  };

  for (const entry of json.spark?.result ?? []) {
    const meta = entry.response?.[0]?.meta;
    if (!meta) continue;
    const snap = mapSparkMeta(meta);
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

function alignRowsToCanonical(
  merged: Map<string, QuoteSnapshot>,
  canonical: readonly string[],
): QuoteSnapshot[] {
  const rows: QuoteSnapshot[] = [];
  for (const original of canonical) {
    const spark = yahooSparkSymbol(original);
    const snap = merged.get(spark) ?? merged.get(original);
    if (snap) {
      rows.push({ ...snap, symbol: original });
    }
  }
  return sortQuotesByCanonicalOrder(rows, canonical);
}

/**
 * Snapshot via Yahoo Finance spark (v7/quote bloqueado com 401 em serverless).
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

  try {
    const batches = chunk(uniq, YAHOO_SPARK_CHUNK);
    const settled = await runWithConcurrency(batches, YAHOO_SPARK_CONCURRENCY, (batch) =>
      fetchYahooSparkBatch(batch, merged),
    );

    const allFailed = settled.every((result) => result.status === "rejected");
    if (allFailed) {
      return emptyIntlBook(canonical, "intl_quotes_http");
    }
  } catch {
    return emptyIntlBook(canonical, "intl_network");
  }

  const sorted = alignRowsToCanonical(merged, canonical);
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
