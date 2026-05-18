import type { QuoteSnapshot, QuotesPayload } from "@/lib/market/types";

export function collectDeskQuotes(payload: QuotesPayload): QuoteSnapshot[] {
  return [...payload.results, ...(payload.crypto ?? [])];
}

export function filterDeskQuotesForSearch(
  quotes: readonly QuoteSnapshot[],
  query: string,
  limit = 8,
): QuoteSnapshot[] {
  const needle = query.trim().toLowerCase();
  if (!needle || needle.length < 1) return [];

  return quotes
    .filter((row) => {
      const symbol = row.symbol.toLowerCase();
      const name = row.shortName?.toLowerCase() ?? "";
      return symbol.includes(needle) || name.includes(needle);
    })
    .slice(0, limit);
}

export function findDeskQuote(
  quotes: readonly QuoteSnapshot[],
  symbol: string,
): QuoteSnapshot | undefined {
  const clean = symbol.trim().toUpperCase();
  return quotes.find((row) => row.symbol.toUpperCase() === clean);
}
