import { rememberWithTtl } from "@/lib/market/market-server-cache";
import { lookupSymbolQuote } from "@/lib/market/lookup-symbol-quote";
import type { QuoteSnapshot } from "@/lib/market/types";
import {
  isValidWatchlistSymbol,
  normalizeWatchlistSymbol,
} from "@/lib/user-watchlist/load";

const BATCH_TTL_MS = 20_000;
const MAX_BATCH = 15;

export type BatchQuoteResult = {
  symbol: string;
  quote: QuoteSnapshot | null;
  simulated: boolean;
};

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

  const results = await Promise.all(
    symbols.map(async (symbol) => {
      const cacheKey = `quote-lookup:${symbol}:v1`;
      const lookup = await rememberWithTtl(cacheKey, BATCH_TTL_MS, () => lookupSymbolQuote(symbol));
      return {
        symbol,
        quote: lookup.quote,
        simulated: lookup.simulated,
      };
    }),
  );

  return { results, truncated };
}

export const PORTFOLIO_BATCH_LOOKUP_MAX = MAX_BATCH;
