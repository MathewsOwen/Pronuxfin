import { inferEquitySectorId } from "@/lib/market/asset-class";
import { listSectorSymbols, type SectorId } from "@/lib/market/sector-universe";
import type { DeskMarketId } from "@/lib/market/world-markets";

function inferSectorId(symbol: string, market: DeskMarketId): SectorId | null {
  const upper = symbol.trim().toUpperCase();
  for (const sector of [
    "commodities",
    "technology",
    "oil_gas",
    "defense_aerospace",
    "financials",
    "healthcare",
    "consumer",
    "utilities",
    "industrials",
  ] as const) {
    if (listSectorSymbols(market, sector).includes(upper)) return sector;
  }
  return inferEquitySectorId(symbol);
}

/** Pares do mesmo setor na mesa PRONUX — não são filiais nem grupo econômico. */
export function listSectorPeersForSymbol(
  symbol: string,
  market: DeskMarketId,
  limit = 14,
): string[] {
  const sectorId = inferSectorId(symbol, market);
  if (!sectorId) return [];
  const upper = symbol.trim().toUpperCase();
  return listSectorSymbols(market, sectorId)
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
