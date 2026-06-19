import { fetchMarket } from "@/lib/http/fetch-with-timeout";
import {
  mapExchangeToDeskMarket,
  normalizeFmpSymbolForDesk,
} from "@/lib/market/exchange-to-desk-market";
import { isFmpProviderEnabled } from "@/lib/market/fmp-config";
import type {
  GlobalAssetSearchHit,
  GlobalAssetSearchResponse,
} from "@/lib/market/global-asset-search-types";
import {
  canUseMarketProvider,
  noteMarketProviderUsage,
} from "@/lib/market/market-provider-budget";
import { rememberWithTtl } from "@/lib/market/market-server-cache";
import { searchLocalUniverse } from "@/lib/market/search-local-universe";
import { DESK_MARKET_META } from "@/lib/market/world-markets";
import { isValidWatchlistSymbol, normalizeWatchlistSymbol } from "@/lib/user-watchlist/load";

const SEARCH_TTL_DEV_MS = 90_000;
const SEARCH_TTL_PRODUCTION_MS = 10 * 60_000;
const COINGECKO_UA =
  "PRONUXFIN/1.0 (+https://pronuxfin.com.br; busca global CoinGecko)";

export type SearchGlobalAssetsOptions = {
  /** When false, only the curated local universe is queried (no FMP/CoinGecko). */
  includeUpstream?: boolean;
};

function searchCacheTtlMs(): number {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  ) {
    return SEARCH_TTL_PRODUCTION_MS;
  }
  return SEARCH_TTL_DEV_MS;
}

function fmpApiKey(): string {
  return (
    process.env.FMP_API_KEY?.trim() ||
    process.env.FINANCIAL_MODELING_PREP_API_KEY?.trim() ||
    ""
  );
}

function mergeHits(
  batches: GlobalAssetSearchHit[][],
  limit: number,
): GlobalAssetSearchHit[] {
  const seen = new Set<string>();
  const out: GlobalAssetSearchHit[] = [];
  for (const batch of batches) {
    for (const hit of batch) {
      const symbol = normalizeWatchlistSymbol(hit.symbol);
      if (!isValidWatchlistSymbol(symbol)) continue;
      const key = `${hit.assetClass}:${symbol}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ ...hit, symbol });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

async function searchFmpEquities(query: string, limit: number): Promise<GlobalAssetSearchHit[]> {
  if (
    !isFmpProviderEnabled() ||
    !(await canUseMarketProvider("financial_modeling_prep"))
  ) {
    return [];
  }
  const apiKey = fmpApiKey();
  if (!apiKey) return [];

  const url =
    `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(query)}` +
    `&limit=${Math.min(limit, 20)}&apikey=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetchMarket(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "PRONUXFIN/1.0 (+https://pronuxfin.com.br; busca global FMP)",
      },
      cache: "no-store",
    });
    if (!res.ok) return [];

    const json = (await res.json()) as Array<{
      symbol?: string;
      name?: string;
      currency?: string;
      stockExchange?: string;
      exchangeShortName?: string;
    }>;

    await noteMarketProviderUsage("financial_modeling_prep");

    const hits: GlobalAssetSearchHit[] = [];
    for (const row of json) {
      const rawSymbol = String(row.symbol ?? "").trim();
      const name = String(row.name ?? rawSymbol).trim();
      if (!rawSymbol || !name) continue;

      const symbol = normalizeFmpSymbolForDesk(rawSymbol);
      if (!isValidWatchlistSymbol(symbol)) continue;

      const exchangeLabel =
        row.exchangeShortName?.trim() || row.stockExchange?.trim() || null;
      const deskMarket = mapExchangeToDeskMarket(exchangeLabel, symbol);
      const meta = DESK_MARKET_META[deskMarket];

      hits.push({
        symbol,
        name,
        assetClass: "equity",
        deskMarket,
        exchangeLabel: exchangeLabel ?? meta.exchangeLabelEn,
        flag: meta.flag,
        marketCapRank: null,
        source: "fmp",
      });
      if (hits.length >= limit) break;
    }
    return hits;
  } catch {
    return [];
  }
}

async function searchCoinGecko(query: string, limit: number): Promise<GlobalAssetSearchHit[]> {
  if (!(await canUseMarketProvider("coingecko"))) return [];

  try {
    const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`;
    const res = await fetchMarket(url, {
      headers: { Accept: "application/json", "User-Agent": COINGECKO_UA },
      cache: "no-store",
    });
    if (!res.ok) return [];

    const json = (await res.json()) as {
      coins?: Array<{
        id?: string;
        name?: string;
        symbol?: string;
        market_cap_rank?: number;
      }>;
    };

    await noteMarketProviderUsage("coingecko");

    const hits: GlobalAssetSearchHit[] = [];
    for (const coin of json.coins ?? []) {
      const symbol = normalizeWatchlistSymbol(coin.symbol ?? "");
      const name = String(coin.name ?? symbol).trim();
      if (!symbol || !name || !isValidWatchlistSymbol(symbol)) continue;
      hits.push({
        symbol,
        name,
        assetClass: "crypto",
        deskMarket: null,
        exchangeLabel: "Crypto",
        flag: "🪙",
        marketCapRank:
          typeof coin.market_cap_rank === "number" ? coin.market_cap_rank : null,
        source: "coingecko",
      });
      if (hits.length >= limit) break;
    }
    return hits;
  } catch {
    return [];
  }
}

export async function searchGlobalAssets(
  queryInput: string,
  limit = 16,
  options?: SearchGlobalAssetsOptions,
): Promise<GlobalAssetSearchResponse> {
  const query = queryInput.trim();
  if (query.length < 2) {
    return { query, results: [], partial: false, fetchedAt: Date.now() };
  }

  const includeUpstream = options?.includeUpstream !== false;
  const cacheKey = `global-asset-search:${includeUpstream ? "full" : "local"}:${query.toLowerCase()}:v2`;

  return rememberWithTtl(cacheKey, searchCacheTtlMs(), async () => {
    const local = searchLocalUniverse(query, limit);

    if (!includeUpstream) {
      return {
        query,
        results: local.slice(0, limit),
        partial: false,
        upstreamLimited: true,
        fetchedAt: Date.now(),
      };
    }

    const [fmp, crypto] = await Promise.all([
      searchFmpEquities(query, limit),
      searchCoinGecko(query, Math.min(limit, 10)),
    ]);

    const results = mergeHits([local, fmp, crypto], limit);
    const partial = fmp.length === 0 && query.length >= 3 && isFmpProviderEnabled();

    return {
      query,
      results,
      partial,
      fetchedAt: Date.now(),
    };
  });
}
