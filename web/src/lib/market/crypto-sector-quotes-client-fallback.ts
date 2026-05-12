import { simulatedCryptoSectorQuotes } from "@/lib/market/crypto";
import {
  listCryptoSectorAssets,
  type CryptoSectorId,
} from "@/lib/market/crypto-sector-universe";
import type { CryptoSectorBookPayload } from "@/lib/market/types";

export function cryptoSectorDeskPlaceholderPayload(
  sector: CryptoSectorId,
): CryptoSectorBookPayload {
  const assets = listCryptoSectorAssets(sector);
  return {
    fetchedAt: 0,
    sector,
    universeCount: assets.length,
    source: "coingecko",
    results: simulatedCryptoSectorQuotes(sector),
    simulated: true,
    partial: false,
  };
}

export function cryptoSectorDeskFallbackPayload(
  sector: CryptoSectorId,
): CryptoSectorBookPayload {
  const assets = listCryptoSectorAssets(sector);
  return {
    fetchedAt: Date.now(),
    sector,
    universeCount: assets.length,
    source: "coingecko",
    results: simulatedCryptoSectorQuotes(sector),
    simulated: true,
    partial: false,
  };
}
