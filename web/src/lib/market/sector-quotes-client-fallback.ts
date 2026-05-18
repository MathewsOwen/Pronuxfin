import {
  simulatedB3EquitiesForSymbols,
  simulatedIntlEquitiesForSymbols,
} from "@/lib/market/equities-sim";
import { clientAllowsSimulatedMarketData } from "@/lib/market/market-data-policy";
import type { EquityMarketRegion, SectorBookPayload } from "@/lib/market/types";

function degradedSectorBook(
  region: EquityMarketRegion,
  sector: string,
  symbols: readonly string[],
): SectorBookPayload {
  return {
    fetchedAt: Date.now(),
    region,
    sector,
    universeCount: symbols.length,
    source: region === "br" ? "brapi" : "yahoo",
    results: [],
    simulated: false,
    partial: true,
  };
}

/** Primeira pintura: vazio até a API responder. */
export function sectorDeskPlaceholderPayload(
  region: EquityMarketRegion,
  sector: string,
  symbols: readonly string[],
): SectorBookPayload {
  return {
    fetchedAt: 0,
    region,
    sector,
    universeCount: symbols.length,
    source: region === "br" ? "brapi" : "yahoo",
    results: [],
    simulated: false,
    partial: true,
  };
}

export function sectorDeskFallbackPayload(
  region: EquityMarketRegion,
  sector: string,
  symbols: readonly string[],
): SectorBookPayload {
  if (!clientAllowsSimulatedMarketData()) {
    return degradedSectorBook(region, sector, symbols);
  }

  const results =
    region === "br"
      ? simulatedB3EquitiesForSymbols(symbols)
      : simulatedIntlEquitiesForSymbols(symbols);
  return {
    fetchedAt: Date.now(),
    region,
    sector,
    universeCount: symbols.length,
    source: region === "br" ? "brapi" : "yahoo",
    results,
    simulated: true,
    partial: false,
  };
}
