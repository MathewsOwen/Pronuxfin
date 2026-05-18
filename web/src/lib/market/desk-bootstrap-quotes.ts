import type { QuotesPayload } from "@/lib/market/types";

/** `fetchedAt: 0` = ainda não houve leitura da API nesta sessão — sem números inventados. */
export function deskBootstrapQuotesPayload(): QuotesPayload {
  return {
    fetchedAt: 0,
    results: [],
    crypto: [],
    simulated: false,
    cryptoSimulated: false,
    dataMode: "degraded",
  };
}
