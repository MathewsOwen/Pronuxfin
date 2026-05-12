import { loadCachedCryptoSectorQuotesPayload } from "@/lib/market/market-data-gateway";
import {
  type CryptoSectorId,
} from "@/lib/market/crypto-sector-universe";
import type { CryptoSectorBookPayload } from "@/lib/market/types";

export async function loadCryptoSectorQuotesPayload(
  sector: CryptoSectorId,
): Promise<{ payload: CryptoSectorBookPayload; warnings: string[] }> {
  return loadCachedCryptoSectorQuotesPayload(sector);
}
