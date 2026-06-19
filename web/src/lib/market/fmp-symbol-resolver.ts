import type { DeskMarketId } from "@/lib/market/world-markets";

/** Símbolo FMP para fundamentos — alinhado ao formato Yahoo por bolsa. */
export function resolveFmpEquitySymbol(symbol: string, market: DeskMarketId): string {
  const upper = symbol.trim().toUpperCase();
  if (market === "br") return `${upper}.SA`;
  return upper;
}
