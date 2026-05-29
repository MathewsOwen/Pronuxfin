import { fetchMarket } from "@/lib/http/fetch-with-timeout";
import { sortQuotesByCanonicalOrder } from "@/lib/market/quote-order";
import { simulatedIntlEquitiesForSymbols } from "@/lib/market/equities-sim";
import type { QuoteSnapshot } from "@/lib/market/types";

const YAHOO_CHUNK = 56;

function chunk<T>(arr: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
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

  try {
    const batches = chunk(uniq, YAHOO_CHUNK);
    for (const batch of batches) {
      if (batch.length === 0) continue;
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
        return {
          rows: sortQuotesByCanonicalOrder(
            simulatedIntlEquitiesForSymbols(canonical),
            canonical,
          ),
          simulated: true,
          partial: false,
          warning: "intl_quotes_http",
        };
      }

      const json = (await res.json()) as {
        quoteResponse?: { result?: Array<Record<string, unknown>>; error?: unknown };
      };

      const raw = json.quoteResponse?.result ?? [];
      for (const row of raw) {
        const snap = mapYahooRow(row);
        if (snap) merged.set(snap.symbol, snap);
      }
    }
  } catch {
    return {
      rows: sortQuotesByCanonicalOrder(
        simulatedIntlEquitiesForSymbols(canonical),
        canonical,
      ),
      simulated: true,
      partial: false,
      warning: "intl_network",
    };
  }

  const sorted = sortQuotesByCanonicalOrder([...merged.values()], canonical);
  if (sorted.length === 0) {
    return {
      rows: sortQuotesByCanonicalOrder(simulatedIntlEquitiesForSymbols(canonical), canonical),
      simulated: true,
      partial: false,
      warning: "intl_empty",
    };
  }

  const partial = sorted.length < uniq.length;
  return {
    rows: sorted,
    simulated: false,
    partial,
    ...(partial ? { warning: "intl_partial" as const } : {}),
  };
}
