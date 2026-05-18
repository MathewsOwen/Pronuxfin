import { fetchBrapiQuotesForSymbols } from "@/lib/market/equities-brapi";
import { fetchYahooQuotesForSymbols } from "@/lib/market/equities-yahoo-quote";
import { resolveQuotesDataMode } from "@/lib/market/market-data-policy";
import type { MarketDataMode, QuoteSnapshot } from "@/lib/market/types";
import {
  detectWatchlistRegion,
  isValidWatchlistSymbol,
  normalizeWatchlistSymbol,
} from "@/lib/user-watchlist/load";

export type SymbolQuoteLookup = {
  quote: QuoteSnapshot | null;
  simulated: boolean;
  dataMode: MarketDataMode;
};

export async function lookupSymbolQuote(symbolInput: string): Promise<SymbolQuoteLookup> {
  const symbol = normalizeWatchlistSymbol(symbolInput);
  if (!isValidWatchlistSymbol(symbol)) {
    return { quote: null, simulated: false, dataMode: "degraded" };
  }

  const region = detectWatchlistRegion(symbol);
  const book =
    region === "br"
      ? await fetchBrapiQuotesForSymbols([symbol], { sortOrder: [symbol] })
      : await fetchYahooQuotesForSymbols([symbol], [symbol]);

  const quote = book.rows[0] ?? null;
  const dataMode = resolveQuotesDataMode({
    resultsCount: quote ? 1 : 0,
    cryptoCount: 0,
    simulated: book.simulated,
    cryptoSimulated: false,
  });

  return {
    quote,
    simulated: book.simulated,
    dataMode,
  };
}
