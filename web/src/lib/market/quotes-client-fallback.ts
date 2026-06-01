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

/** @deprecated Simulação removida — mantido só para compatibilidade de testes legados. */
export function simulatedDeskFallbackPayload(): QuotesPayload {
  return degradedDeskFallbackPayload();
}

/** Fallback após falha de rede ou HTTP na strip / mesa pública — nunca inventa cotações. */
export function resolveClientQuotesFallback(): QuotesPayload {
  return degradedDeskFallbackPayload();
}

/** @deprecated Use resolveClientQuotesFallback */
export function liveDeskFallbackPayload(): QuotesPayload {
  return resolveClientQuotesFallback();
}
