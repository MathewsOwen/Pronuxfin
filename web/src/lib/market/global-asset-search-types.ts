import type { AssetClass } from "@/lib/market/types";
import type { DeskMarketId } from "@/lib/market/world-markets";

export type GlobalAssetSearchHit = {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  deskMarket: DeskMarketId | null;
  exchangeLabel: string | null;
  /** ISO 3166-1 alpha-2 para bandeira na UI. */
  countryCode: string | null;
  flag: string | null;
  marketCapRank: number | null;
  source: "local" | "fmp" | "coingecko";
};

export type GlobalAssetSearchResponse = {
  query: string;
  results: GlobalAssetSearchHit[];
  partial: boolean;
  /** True when upstream providers were skipped (e.g. anonymous tier). */
  upstreamLimited?: boolean;
  fetchedAt: number;
};
