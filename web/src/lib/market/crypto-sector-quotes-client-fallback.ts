import {
  listCryptoSectorAssets,
  type CryptoSectorId,
} from "@/lib/market/crypto-sector-universe";
import type { CryptoSectorBookPayload } from "@/lib/market/types";

function degradedCryptoSectorBook(sector: CryptoSectorId): CryptoSectorBookPayload {
  const assets = listCryptoSectorAssets(sector);
  return {
    fetchedAt: Date.now(),
    sector,
    universeCount: assets.length,
    source: "coingecko",
    results: [],
    simulated: false,
    partial: true,
  };
}

export function cryptoSectorDeskPlaceholderPayload(
  sector: CryptoSectorId,
): CryptoSectorBookPayload {
  const assets = listCryptoSectorAssets(sector);
  return {
    fetchedAt: 0,
    sector,
    universeCount: assets.length,
    source: "coingecko",
    results: [],
    simulated: false,
    partial: true,
  };
}

export function cryptoSectorDeskFallbackPayload(
  sector: CryptoSectorId,
): CryptoSectorBookPayload {
  return degradedCryptoSectorBook(sector);
}
