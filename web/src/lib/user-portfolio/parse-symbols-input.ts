import { isValidWatchlistSymbol, normalizeWatchlistSymbol } from "@/lib/user-watchlist/load";

/** Aceita lista separada por vírgula, espaço ou quebra de linha. */
export function parseSymbolsInput(raw: string): string[] {
  const parts = raw
    .split(/[\s,;]+/)
    .map((part) => normalizeWatchlistSymbol(part))
    .filter(Boolean);

  const out: string[] = [];
  const seen = new Set<string>();
  for (const symbol of parts) {
    if (!isValidWatchlistSymbol(symbol)) continue;
    if (seen.has(symbol)) continue;
    seen.add(symbol);
    out.push(symbol);
  }
  return out;
}
