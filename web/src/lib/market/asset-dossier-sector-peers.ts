import { SECTOR_ORDER, listSectorSymbols, type SectorId } from "@/lib/market/sector-universe";
import type { EquityMarketRegion } from "@/lib/market/types";

function inferSectorId(symbol: string, region: EquityMarketRegion): SectorId | null {
  for (const sector of SECTOR_ORDER) {
    if (listSectorSymbols(region, sector).includes(symbol)) {
      return sector;
    }
  }
  return null;
}

/** Pares do mesmo setor na mesa PRONUX — não são filiais nem grupo econômico. */
export function listSectorPeersForSymbol(
  symbol: string,
  region: EquityMarketRegion,
  limit = 14,
): string[] {
  const sectorId = inferSectorId(symbol, region);
  if (!sectorId) return [];
  const upper = symbol.trim().toUpperCase();
  return listSectorSymbols(region, sectorId)
    .filter((s) => s !== upper)
    .slice(0, limit);
}

export function mergeComparablePeers(
  symbol: string,
  sectorPeers: string[],
  externalPeers: string[] | null,
  limit = 16,
): string[] {
  const upper = symbol.trim().toUpperCase();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const peer of [...(externalPeers ?? []), ...sectorPeers]) {
    const p = peer.trim().toUpperCase();
    if (!p || p === upper || seen.has(p)) continue;
    seen.add(p);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}
