import { simulatedCryptoQuotes } from "@/lib/market/crypto";
import { simulatedEquities } from "@/lib/market/equities-brapi";
import { sortQuotesForDesk } from "@/lib/market/indices";
import type { QuotesPayload } from "@/lib/market/types";

/** Resposta cliente quando `/api/quotes` falha — série ainda dependente do tempo. */
export function liveDeskFallbackPayload(): QuotesPayload {
  return {
    fetchedAt: Date.now(),
    results: sortQuotesForDesk(simulatedEquities()),
    crypto: simulatedCryptoQuotes(),
    simulated: true,
    cryptoSimulated: true,
    cryptoPartial: false,
  };
}
