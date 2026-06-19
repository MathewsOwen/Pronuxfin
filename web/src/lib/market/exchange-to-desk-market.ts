import { detectDeskMarketFromSymbol } from "@/lib/market/asset-class";
import type { DeskMarketId } from "@/lib/market/world-markets";

const EXCHANGE_HINTS: ReadonlyArray<[RegExp, DeskMarketId]> = [
  [/\bB3\b|BOVESPA|BRASIL|BRAZIL|SAO\s*PAULO/i, "br"],
  [/\bNYSE\b|\bNASDAQ\b|\bAMEX\b|\bUS\b|NEW\s*YORK/i, "us"],
  [/\bSSE\b|\bSZSE\b|SHANGHAI|SHENZHEN/i, "cn"],
  [/\bHKEX\b|HONG\s*KONG/i, "hk"],
  [/\bTSE\b|TOKYO|JAPAN|JPX/i, "jp"],
  [/\bLSE\b|LONDON/i, "gb"],
  [/\bXETRA\b|FRANKFURT|GERMANY/i, "de"],
  [/\bPARIS\b|EURONEXT\s*PAR/i, "fr"],
  [/\bNSE\b|\bBSE\b|INDIA|MUMBAI/i, "in"],
  [/\bTSX\b|TORONTO|CANADA/i, "ca"],
  [/\bTADAWUL\b|SAUDI/i, "sa"],
  [/\bSIX\b|SWITZ/i, "ch"],
  [/\bASX\b|AUSTRAL/i, "au"],
  [/\bKRX\b|KOREA|KOSPI/i, "kr"],
  [/\bAMSTERDAM\b|AEX/i, "nl"],
  [/\bTWSE\b|TAIWAN|TAIPEI/i, "tw"],
  [/\bSTOCKHOLM\b|SWEDEN/i, "se"],
  [/\bMILAN\b|ITALY|BORSA/i, "it"],
  [/\bMADRID\b|SPAIN|BME/i, "es"],
  [/\bSGX\b|SINGAPORE/i, "sg"],
];

export function normalizeFmpSymbolForDesk(raw: string): string {
  const upper = raw.trim().toUpperCase();
  if (upper.endsWith(".SA")) return upper.slice(0, -3);
  return upper;
}

export function mapExchangeToDeskMarket(
  exchangeLabel: string | null | undefined,
  symbol: string,
): DeskMarketId {
  const fromSymbol = detectDeskMarketFromSymbol(symbol);
  if (fromSymbol !== "us" || symbol.includes(".")) return fromSymbol;
  if (symbol.endsWith(".SA")) return "br";

  const hay = (exchangeLabel ?? "").trim();
  if (!hay) return fromSymbol;

  for (const [pattern, market] of EXCHANGE_HINTS) {
    if (pattern.test(hay)) return market;
  }
  return fromSymbol;
}
