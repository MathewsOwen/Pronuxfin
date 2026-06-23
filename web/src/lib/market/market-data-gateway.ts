import {
  fetchAggregatedNews,
  fetchAggregatedNewsWithDiagnostics,
  type NewsFetchDiagnostics,
} from "@/lib/market/fetch-news";
import { fetchCryptoSectorQuotesBrl, fetchCryptoQuotesBrl } from "@/lib/market/crypto";
import { fetchBrapiQuotesForSymbols, fetchEquitiesFromBrapi } from "@/lib/market/equities-brapi";
import { fetchFmpQuotesForSymbols } from "@/lib/market/fmp-equity-quotes";
import { fetchYahooQuotesForSymbols } from "@/lib/market/equities-yahoo-quote";
import { sortQuotesForDesk } from "@/lib/market/indices";
import { listLiveDeskIntlTickers } from "@/lib/market/live-desk-universe";
import { resolveMarketProviderFallback } from "@/lib/market/market-data-policy";
import { rememberWithTtl } from "@/lib/market/market-server-cache";
import {
  getMarketProviderBudgetWarning,
  noteMarketProviderUsage,
} from "@/lib/market/market-provider-budget";
import {
  getMarketTaskProviders,
  type MarketDataTask,
  type MarketProviderId,
} from "@/lib/market/market-provider-registry";
import {
  listSectorSymbols,
  type MarketRegionId,
  type SectorId,
} from "@/lib/market/sector-universe";
import { deskMarketUsesBrapi, normalizeDeskMarketId } from "@/lib/market/world-markets";
import {
  listCryptoSectorAssets,
  type CryptoSectorId,
} from "@/lib/market/crypto-sector-universe";
import { resolveQuotesDataMode } from "@/lib/market/market-data-policy";
import { sortQuotesByCanonicalOrder } from "@/lib/market/quote-order";
import type {
  CryptoSectorBookPayload,
  NewsArticle,
  QuotesPayload,
  QuoteSnapshot,
  SectorBookPayload,
} from "@/lib/market/types";

const CACHE_TTL = {
  liveDeskMs: 20_000,
  sectorBookMs: 45_000,
  cryptoSectorBookMs: 45_000,
  relatedNewsMs: 2 * 60_000,
} as const;

export async function loadCachedQuotesPayload(): Promise<{
  payload: QuotesPayload;
  warnings: string[];
}> {
  return rememberWithTtl("market-gateway:live-desk:v11", CACHE_TTL.liveDeskMs, async () => {
    const warnings: string[] = [];

    const [equities, intlEquities, crypto] = await Promise.all([
      loadBrEquitiesSnapshot(warnings),
      loadIntlEquitiesSnapshot(warnings),
      loadCryptoSnapshot(warnings),
    ]);

    const brOrdered = sortQuotesForDesk(equities.rows);
    const brSymbols = new Set(brOrdered.map((row) => row.symbol));
    const intlRows = intlEquities.rows.filter((row) => !brSymbols.has(row.symbol));
    const mergedEquities = [...brOrdered, ...intlRows];

    const payload: QuotesPayload = {
      fetchedAt: Date.now(),
      results: mergedEquities,
      crypto: crypto.rows,
      simulated: equities.simulated || intlEquities.simulated,
      cryptoSimulated: crypto.simulated,
      cryptoPartial: crypto.partial,
      equitiesPartial:
        (equities.partial && !equities.simulated) ||
        (intlEquities.partial && !intlEquities.simulated),
      dataMode: resolveQuotesDataMode({
        resultsCount: mergedEquities.length,
        cryptoCount: crypto.rows.length,
        simulated: equities.simulated || intlEquities.simulated,
        cryptoSimulated: crypto.simulated,
      }),
    };

    return { payload, warnings: dedupeWarnings(warnings) };
  });
}

export async function loadCachedSectorQuotesPayload(
  marketInput: MarketRegionId | string,
  sector: SectorId,
): Promise<{ payload: SectorBookPayload; warnings: string[] }> {
  const market = normalizeDeskMarketId(String(marketInput)) ?? "br";
  return rememberWithTtl(
    `market-gateway:sector:${market}:${sector}:v9`,
    CACHE_TTL.sectorBookMs,
    async () => {
      const warnings: string[] = [];
      const symbols = listSectorSymbols(market, sector);
      const now = Date.now();

      if (deskMarketUsesBrapi(market)) {
        const book = await executeProviderChain(
          "sector_book_br",
          {
            brapi: async () => {
              const result = await fetchBrapiQuotesForSymbols(symbols, {
                sortOrder: symbols,
              });
              return {
                rows: result.rows,
                simulated: result.simulated,
                partial: result.partial,
                warning: result.warning,
                source: "brapi" as const,
              };
            },
          },
          warnings,
          () =>
            resolveMarketProviderFallback("sector_book_br", () => ({
              rows: [],
              simulated: false,
              partial: true,
              source: "brapi" as const,
              warning: "equities_fallback_budget",
            })),
        );

        const sectorRows = sortQuotesByCanonicalOrder(book.rows, symbols);
        if (book.warning) warnings.push(book.warning);

        const payload: SectorBookPayload = {
          fetchedAt: now,
          region: market,
          sector,
          universeCount: symbols.length,
          source: "brapi",
          results: sectorRows,
          simulated: false,
          partial: sectorRows.length < symbols.length,
        };
        return { payload, warnings: dedupeWarnings(warnings) };
      }

      const book = await executeProviderChain(
        "sector_book_intl",
        {
          yahoo: async () => {
            const result = await fetchYahooQuotesForSymbols(symbols, symbols);
            return {
              rows: result.rows,
              simulated: result.simulated,
              partial: result.partial,
              warning: result.warning,
              source: "yahoo" as const,
            };
          },
          financial_modeling_prep: async () => {
            const result = await fetchFmpQuotesForSymbols(symbols, symbols);
            return {
              rows: result.rows,
              simulated: result.simulated,
              partial: result.partial,
              warning: result.warning,
              source: "yahoo" as const,
            };
          },
        },
        warnings,
        () =>
          resolveMarketProviderFallback("sector_book_intl", () => ({
            rows: [],
            simulated: false,
            partial: true,
            source: "yahoo" as const,
            warning: "intl_fallback_budget",
          })),
      );

      const payload: SectorBookPayload = {
        fetchedAt: now,
        region: market,
        sector,
        universeCount: symbols.length,
        source: book.source,
        results: book.rows,
        simulated: book.simulated,
        partial: book.partial,
      };
      if (book.warning) warnings.push(book.warning);
      return { payload, warnings: dedupeWarnings(warnings) };
    },
  );
}

export async function loadCachedCryptoSectorQuotesPayload(
  sector: CryptoSectorId,
): Promise<{ payload: CryptoSectorBookPayload; warnings: string[] }> {
  return rememberWithTtl(
    `market-gateway:crypto-sector:${sector}:v1`,
    CACHE_TTL.cryptoSectorBookMs,
    async () => {
      const warnings: string[] = [];
      const universe = listCryptoSectorAssets(sector);
      const now = Date.now();

      const book = await executeProviderChain(
        "crypto_sector_book",
        {
          coingecko: async () => {
            const result = await fetchCryptoSectorQuotesBrl(sector);
            return {
              rows: result.rows,
              simulated: false,
              partial: result.partial,
              warning: result.partial ? "crypto_sector_partial" : undefined,
              source: "coingecko" as const,
            };
          },
        },
        warnings,
        () =>
          resolveMarketProviderFallback("crypto_sector_book", () => ({
            rows: [],
            simulated: false,
            partial: true,
            warning: "crypto_sector_fallback",
            source: "coingecko" as const,
          })),
      );

      const payload: CryptoSectorBookPayload = {
        fetchedAt: now,
        sector,
        universeCount: universe.length,
        source: book.source,
        results: book.rows,
        simulated: book.simulated,
        partial: book.partial,
      };
      if (book.warning) warnings.push(book.warning);
      return { payload, warnings: dedupeWarnings(warnings) };
    },
  );
}

export async function loadCachedAggregatedNews(
  limit = 72,
): Promise<NewsArticle[]> {
  return rememberWithTtl(
    `market-gateway:related-news:${limit}:v3`,
    CACHE_TTL.relatedNewsMs,
    async () => {
      const articles = await fetchAggregatedNews(limit);
      if (articles.length > 0) {
        await noteMarketProviderUsage("rss_public");
      }
      return articles;
    },
    {
      shortTtlMs: 15_000,
      shouldRetain: (articles) => articles.length > 0,
    },
  );
}

/**
 * Same cache as {@link loadCachedAggregatedNews} but preserves per-source
 * diagnostics so the UI can distinguish "feed offline" from "no fresh items".
 */
export async function loadCachedAggregatedNewsDiagnostics(
  limit = 72,
): Promise<NewsFetchDiagnostics> {
  return rememberWithTtl(
    `market-gateway:related-news-diag:${limit}:v4`,
    CACHE_TTL.relatedNewsMs,
    async () => {
      const diag = await fetchAggregatedNewsWithDiagnostics(limit);
      if (diag.articles.length > 0) {
        await noteMarketProviderUsage("rss_public");
      }
      return diag;
    },
    {
      shortTtlMs: 15_000,
      shouldRetain: (diag) => diag.articles.length > 0,
    },
  );
}

async function loadBrEquitiesSnapshot(warnings: string[]) {
  return executeProviderChain(
    "br_equities_snapshot",
    {
      brapi: async () => {
        const result = await fetchEquitiesFromBrapi();
        return {
          rows: result.rows,
          simulated: result.simulated,
          partial: result.partial,
          warning: result.warning,
        };
      },
    },
    warnings,
    () =>
      resolveMarketProviderFallback("br_equities_snapshot", () => ({
        rows: [],
        simulated: false,
        partial: true,
        warning: "equities_fallback_budget",
      })),
  );
}

async function loadIntlEquitiesSnapshot(warnings: string[]) {
  const tickers = listLiveDeskIntlTickers();
  if (tickers.length === 0) {
    return {
      rows: [],
      simulated: false,
      partial: false,
    };
  }

  return executeProviderChain(
    "intl_equities_snapshot",
    {
      yahoo: async () => {
        const result = await fetchYahooQuotesForSymbols(tickers, tickers);
        return {
          rows: result.rows,
          simulated: result.simulated,
          partial: result.partial,
          warning: result.warning,
        };
      },
      financial_modeling_prep: async () => {
        const result = await fetchFmpQuotesForSymbols(tickers, tickers);
        return {
          rows: result.rows,
          simulated: result.simulated,
          partial: result.partial,
          warning: result.warning,
        };
      },
    },
    warnings,
    () =>
      resolveMarketProviderFallback("intl_equities_snapshot", () => ({
        rows: [],
        simulated: false,
        partial: true,
        warning: "intl_fallback_budget",
      })),
  );
}

async function loadCryptoSnapshot(warnings: string[]) {
  return executeProviderChain(
    "crypto_snapshot",
    {
      coingecko: async () => {
        const result = await fetchCryptoQuotesBrl();
        return {
          rows: result.rows,
          simulated: false,
          partial: result.partial,
          warning: result.partial ? "crypto_partial" : undefined,
        };
      },
    },
    warnings,
    () =>
      resolveMarketProviderFallback("crypto_snapshot", () => ({
        rows: [],
        simulated: false,
        partial: true,
        warning: "crypto_fallback",
      })),
  );
}

async function executeProviderChain<T extends { warning?: string }>(
  task: MarketDataTask,
  executors: Partial<Record<MarketProviderId, () => Promise<T>>>,
  warnings: string[],
  fallback: () => T,
): Promise<T> {
  const providers = getMarketTaskProviders(task);

  for (const provider of providers) {
    const execute = executors[provider];
    if (!execute) continue;

    const budgetWarning = await getMarketProviderBudgetWarning(provider);
    if (budgetWarning) {
      warnings.push(budgetWarning);
      continue;
    }

    try {
      const result = await execute();
      if (
        "rows" in result &&
        Array.isArray(result.rows) &&
        result.rows.length === 0
      ) {
        warnings.push(`${provider}_empty`);
        continue;
      }
      await noteMarketProviderUsage(provider);
      return result;
    } catch {
      warnings.push(`${provider}_failed`);
    }
  }

  return fallback();
}

function dedupeWarnings(warnings: string[]) {
  return [...new Set(warnings.filter(Boolean))];
}
