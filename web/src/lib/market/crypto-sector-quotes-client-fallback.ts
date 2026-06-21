import {
  listCryptoSectorAssets,
  type CryptoSectorId,
} from "@/lib/market/crypto-sector-universe";
import { buildSkeletonQuoteRows } from "@/lib/market/sector-quotes-client-fallback";
import type { CryptoSectorBookPayload, QuoteSnapshot } from "@/lib/market/types";

function cryptoSkeletonRows(sector: CryptoSectorId): QuoteSnapshot[] {
  const assets = listCryptoSectorAssets(sector);
  return buildSkeletonQuoteRows(
    assets.map((a) => a.symbol),
    { segment: "crypto" },
  ).map((row, index) => ({
    ...row,
    shortName: assets[index]?.shortName,
    currency: "BRL",
  }));
}

function degradedCryptoSectorBook(sector: CryptoSectorId): CryptoSectorBookPayload {
  const assets = listCryptoSectorAssets(sector);
  return {
    fetchedAt: Date.now(),
    sector,
    universeCount: assets.length,
    source: "coingecko",
    results: cryptoSkeletonRows(sector),
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
    results: cryptoSkeletonRows(sector),
    simulated: false,
    partial: true,
  };
}

export function cryptoSectorDeskFallbackPayload(
  sector: CryptoSectorId,
): CryptoSectorBookPayload {
  return degradedCryptoSectorBook(sector);
}
