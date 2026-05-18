import { simulatedCryptoQuotes } from "@/lib/market/crypto";
import { simulatedEquities } from "@/lib/market/equities-brapi";
import { sortQuotesForDesk } from "@/lib/market/indices";
import type { QuotesPayload } from "@/lib/market/types";

/** Cliente: sem cotações inventadas quando a API falha em produção estrita. */
export function degradedDeskFallbackPayload(): QuotesPayload {
  return {
    fetchedAt: Date.now(),
    results: [],
    crypto: [],
    simulated: false,
    cryptoSimulated: false,
    cryptoPartial: false,
    dataMode: "degraded",
  };
}

/** Resposta cliente quando `/api/quotes` falha — simulação só em dev ou com opt-in explícito. */
export function simulatedDeskFallbackPayload(): QuotesPayload {
  return {
    fetchedAt: Date.now(),
    results: sortQuotesForDesk(simulatedEquities()),
    crypto: simulatedCryptoQuotes(),
    simulated: true,
    cryptoSimulated: true,
    cryptoPartial: false,
    dataMode: "simulated",
  };
}

function clientAllowsSimulatedQuotes(): boolean {
  if (process.env.NEXT_PUBLIC_MARKET_ALLOW_SIMULATION === "1") return true;
  return process.env.NODE_ENV !== "production";
}

/** Fallback após falha de rede ou HTTP na strip / mesa pública. */
export function resolveClientQuotesFallback(): QuotesPayload {
  return clientAllowsSimulatedQuotes()
    ? simulatedDeskFallbackPayload()
    : degradedDeskFallbackPayload();
}

/** @deprecated Use resolveClientQuotesFallback */
export function liveDeskFallbackPayload(): QuotesPayload {
  return resolveClientQuotesFallback();
}
