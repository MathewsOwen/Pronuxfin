import { loadCachedSectorQuotesPayload } from "@/lib/market/market-data-gateway";
import {
  type MarketRegionId,
  type SectorId,
} from "@/lib/market/sector-universe";
import type { SectorBookPayload } from "@/lib/market/types";

export async function loadSectorQuotesPayload(
  region: MarketRegionId,
  sector: SectorId,
): Promise<{ payload: SectorBookPayload; warnings: string[] }> {
  return loadCachedSectorQuotesPayload(region, sector);
}
