import { fetchBrapiQuotesForSymbols } from "@/lib/market/equities-brapi";
import { fetchYahooQuotesForSymbols } from "@/lib/market/equities-yahoo-quote";
import type { QuoteSnapshot } from "@/lib/market/types";
import {
  detectWatchlistRegion,
  isValidWatchlistSymbol,
  normalizeWatchlistSymbol,
} from "@/lib/user-watchlist/load";

const MAX_BATCH = 15;

export type BatchQuoteResult = {
  symbol: string;
  quote: QuoteSnapshot | null;
  simulated: boolean;
};

function indexQuotesBySymbol(rows: QuoteSnapshot[]): Map<string, QuoteSnapshot> {
  const map = new Map<string, QuoteSnapshot>();
  for (const row of rows) {
    const key = row.symbol.trim().toUpperCase();
    if (key) map.set(key, row);
  }
  return map;
}

/**
 * Resolves many symbols with at most one BRAPI book + one Yahoo book (per region),
 * instead of one upstream call per symbol.
 */
export async function lookupSymbolQuotesBatch(
  symbolsInput: readonly string[],
): Promise<{ results: BatchQuoteResult[]; truncated: boolean }> {
  const symbols = [
    ...new Set(
      symbolsInput
        .map((s) => normalizeWatchlistSymbol(s))
        .filter((s) => isValidWatchlistSymbol(s)),
    ),
  ].slice(0, MAX_BATCH);

  const truncated = symbolsInput.length > MAX_BATCH;

  const brSymbols: string[] = [];
  const intlSymbols: string[] = [];
  for (const symbol of symbols) {
    if (detectWatchlistRegion(symbol) === "br") {
      brSymbols.push(symbol);
    } else {
      intlSymbols.push(symbol);
    }
  }

  const [brBook, intlBook] = await Promise.all([
    brSymbols.length > 0
      ? fetchBrapiQuotesForSymbols(brSymbols, { sortOrder: brSymbols })
      : null,
    intlSymbols.length > 0
      ? fetchYahooQuotesForSymbols(intlSymbols, intlSymbols)
      : null,
  ]);

  const brBySymbol = indexQuotesBySymbol(brBook?.rows ?? []);
  const intlBySymbol = indexQuotesBySymbol(intlBook?.rows ?? []);

  const results: BatchQuoteResult[] = symbols.map((symbol) => {
    const region = detectWatchlistRegion(symbol);
    if (region === "br") {
      return {
        symbol,
        quote: brBySymbol.get(symbol) ?? null,
        simulated: brBook?.simulated ?? false,
      };
    }
    return {
      symbol,
      quote: intlBySymbol.get(symbol) ?? null,
      simulated: intlBook?.simulated ?? false,
    };
  });

  return { results, truncated };
}

export const PORTFOLIO_BATCH_LOOKUP_MAX = MAX_BATCH;
