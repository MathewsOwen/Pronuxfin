/** Categorias exibidas no cenário de auth (lado direito). */
export type AuthMarketLogoCategory =
  | "bank"
  | "br-equity"
  | "exchange"
  | "intl"
  | "crypto";

/** Bancos e IFs listados na B3 — logos via BRAPI (logourl oficial). */
export const AUTH_MARKET_BR_BANKS = [
  "ITUB4",
  "BBDC4",
  "BBAS3",
  "SANB11",
  "BPAC11",
  "ABCB4",
  "BRSR6",
  "BPAN4",
  "CXSE3",
  "PSSA3",
] as const;

/** Blue chips e financeiras abertas — BRAPI. */
export const AUTH_MARKET_BR_EQUITIES = [
  "PETR4",
  "VALE3",
  "WEGE3",
  "ABEV3",
  "MGLU3",
  "RENT3",
  "ELET3",
  "EMBR3",
  "SUZB3",
  "RADL3",
  "XPBR31",
  "BOVA11",
] as const;

/** Bolsa — B3 listada. */
export const AUTH_MARKET_EXCHANGE = ["B3SA3"] as const;

/** ADRs / mega caps — logo via Financial Modeling Prep (PNG oficial). */
export const AUTH_MARKET_INTL = [
  "AAPL",
  "MSFT",
  "NVDA",
  "AMZN",
  "GOOGL",
  "META",
  "TSLA",
  "JPM",
  "GS",
  "V",
  "MA",
  "BRK-B",
] as const;

/** CoinGecko ids → símbolo exibido. */
export const AUTH_MARKET_CRYPTO = [
  { id: "bitcoin", symbol: "BTC" },
  { id: "ethereum", symbol: "ETH" },
  { id: "solana", symbol: "SOL" },
  { id: "binancecoin", symbol: "BNB" },
  { id: "ripple", symbol: "XRP" },
  { id: "cardano", symbol: "ADA" },
  { id: "avalanche-2", symbol: "AVAX" },
  { id: "chainlink", symbol: "LINK" },
] as const;

/** Nomes para hover no cenário de auth (exterior). */
export const INTL_DISPLAY_NAMES: Record<string, string> = {
  AAPL: "Apple",
  MSFT: "Microsoft",
  NVDA: "NVIDIA",
  AMZN: "Amazon",
  GOOGL: "Alphabet",
  META: "Meta",
  TSLA: "Tesla",
  JPM: "JPMorgan",
  GS: "Goldman Sachs",
  V: "Visa",
  MA: "Mastercard",
  "BRK-B": "Berkshire Hathaway",
};

export function fmpStockLogoUrl(symbol: string): string {
  return `https://financialmodelingprep.com/image-stock/${encodeURIComponent(symbol)}.png`;
}

export function brapiIconFallbackUrl(symbol: string): string {
  return `https://icons.brapi.dev/icons/${encodeURIComponent(symbol.trim().toUpperCase())}.svg`;
}

export function categorizeBrSymbol(symbol: string): AuthMarketLogoCategory {
  const s = symbol.trim().toUpperCase();
  if ((AUTH_MARKET_EXCHANGE as readonly string[]).includes(s)) return "exchange";
  if ((AUTH_MARKET_BR_BANKS as readonly string[]).includes(s)) return "bank";
  return "br-equity";
}

export const ALL_AUTH_MARKET_BR_SYMBOLS = [
  ...AUTH_MARKET_BR_BANKS,
  ...AUTH_MARKET_BR_EQUITIES,
  ...AUTH_MARKET_EXCHANGE,
] as const;
