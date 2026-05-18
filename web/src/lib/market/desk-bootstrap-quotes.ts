import { sortQuotesForDesk, QUOTE_TICKERS } from "@/lib/market/indices";
import type { QuoteSnapshot, QuotesPayload } from "@/lib/market/types";

/** Valores estáveis apenas para primeira pintura SSR/CSR igual — substituídos na hora pela API `/api/quotes`. */
const BOOT_CRYPTO: QuoteSnapshot[] = [
  {
    symbol: "BTC",
    shortName: "Bitcoin",
    currency: "BRL",
    regularMarketPrice: 389_847.52,
    regularMarketChange: 412.08,
    regularMarketChangePercent: 0.11,
    segment: "crypto",
  },
  {
    symbol: "ETH",
    shortName: "Ethereum",
    currency: "BRL",
    regularMarketPrice: 15_982.41,
    regularMarketChange: -28.62,
    regularMarketChangePercent: -0.18,
    segment: "crypto",
  },
  {
    symbol: "SOL",
    shortName: "Solana",
    currency: "BRL",
    regularMarketPrice: 892.15,
    regularMarketChange: 6.4,
    regularMarketChangePercent: 0.72,
    segment: "crypto",
  },
];

function deskBootstrapEquities(): QuoteSnapshot[] {
  return QUOTE_TICKERS.map((symbol, i) => ({
    symbol,
    shortName: symbol,
    currency: "BRL",
    regularMarketPrice: Number((18.4 + (i % 11) * 3.17).toFixed(2)),
    regularMarketChange: Number(((i % 5) * 0.02 - 0.04).toFixed(2)),
    regularMarketChangePercent: Number((((i % 7) - 3) * 0.15).toFixed(2)),
    segment: "equity" as const,
  }));
}

/** `fetchedAt: 0` = ainda não houve leitura da API nesta sessão. */
export function deskBootstrapQuotesPayload(): QuotesPayload {
  const allowSim =
    process.env.NEXT_PUBLIC_MARKET_ALLOW_SIMULATION === "1" ||
    process.env.NODE_ENV !== "production";

  if (!allowSim) {
    return {
      fetchedAt: 0,
      results: [],
      crypto: [],
      simulated: false,
      cryptoSimulated: false,
      dataMode: "degraded",
    };
  }

  return {
    fetchedAt: 0,
    results: sortQuotesForDesk(deskBootstrapEquities()),
    crypto: BOOT_CRYPTO,
    simulated: true,
    cryptoSimulated: true,
    dataMode: "simulated",
  };
}
