import {
  simulatedB3EquitiesForSymbols,
  simulatedIntlEquitiesForSymbols,
} from "@/lib/market/equities-sim";
import type { EquityMarketRegion, SectorBookPayload } from "@/lib/market/types";

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
    results:
      region === "br"
        ? simulatedB3EquitiesForSymbols(symbols).map((r) => ({ ...r }))
        : simulatedIntlEquitiesForSymbols(symbols).map((r) => ({ ...r })),
    simulated: true,
    partial: false,
  };
}

export function sectorDeskFallbackPayload(
  region: EquityMarketRegion,
  sector: string,
  symbols: readonly string[],
): SectorBookPayload {
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
