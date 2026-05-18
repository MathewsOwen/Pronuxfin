import { fetchAggregatedNews } from "@/lib/market/fetch-news";
import { fetchCryptoSectorQuotesBrl, fetchCryptoQuotesBrl, simulatedCryptoQuotes, simulatedCryptoSectorQuotes } from "@/lib/market/crypto";
import { fetchBrapiQuotesForSymbols, fetchEquitiesFromBrapi, simulatedEquities } from "@/lib/market/equities-brapi";
import { fetchYahooQuotesForSymbols } from "@/lib/market/equities-yahoo-quote";
import { sortQuotesForDesk } from "@/lib/market/indices";
import { simulatedIntlEquitiesForSymbols, simulatedB3EquitiesForSymbols } from "@/lib/market/equities-sim";
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
import {
  listCryptoSectorAssets,
  type CryptoSectorId,
} from "@/lib/market/crypto-sector-universe";
import { resolveQuotesDataMode } from "@/lib/market/market-data-policy";
import type {
  CryptoSectorBookPayload,
  NewsArticle,
  QuotesPayload,
  SectorBookPayload,
} from "@/lib/market/types";

const CACHE_TTL = {
  liveDeskMs: 30_000,
  sectorBookMs: 45_000,
  cryptoSectorBookMs: 45_000,
  relatedNewsMs: 10 * 60_000,
} as const;

export async function loadCachedQuotesPayload(): Promise<{
  payload: QuotesPayload;
  warnings: string[];
}> {
  return rememberWithTtl("market-gateway:live-desk:v1", CACHE_TTL.liveDeskMs, async () => {
    const warnings: string[] = [];

    const [equities, crypto] = await Promise.all([
      loadBrEquitiesSnapshot(warnings),
      loadCryptoSnapshot(warnings),
    ]);

    const payload: QuotesPayload = {
      fetchedAt: Date.now(),
      results: equities.rows,
      crypto: crypto.rows,
      simulated: equities.simulated,
      cryptoSimulated: crypto.simulated,
      cryptoPartial: crypto.partial,
      equitiesPartial: equities.partial && !equities.simulated,
      dataMode: resolveQuotesDataMode({
        resultsCount: equities.rows.length,
        cryptoCount: crypto.rows.length,
        simulated: equities.simulated,
        cryptoSimulated: crypto.simulated,
      }),
    };

    return { payload, warnings: dedupeWarnings(warnings) };
  });
}

export async function loadCachedSectorQuotesPayload(
  region: MarketRegionId,
  sector: SectorId,
): Promise<{ payload: SectorBookPayload; warnings: string[] }> {
  return rememberWithTtl(
    `market-gateway:sector:${region}:${sector}:v1`,
    CACHE_TTL.sectorBookMs,
    async () => {
      const warnings: string[] = [];
      const symbols = listSectorSymbols(region, sector);
      const now = Date.now();

      if (region === "br") {
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
              rows: simulatedB3EquitiesForSymbols(symbols),
              simulated: true,
              partial: false,
              source: "brapi" as const,
              warning: "equities_fallback_budget",
            })),
        );

        const payload: SectorBookPayload = {
          fetchedAt: now,
          region,
          sector,
          universeCount: symbols.length,
          source: book.source,
          results: book.rows,
          simulated: book.simulated,
          partial: book.partial,
        };
        if (book.warning) warnings.push(book.warning);
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
        },
        warnings,
        () =>
          resolveMarketProviderFallback("sector_book_intl", () => ({
            rows: simulatedIntlEquitiesForSymbols(symbols),
            simulated: true,
            partial: false,
            source: "yahoo" as const,
            warning: "intl_fallback_budget",
          })),
      );

      const payload: SectorBookPayload = {
        fetchedAt: now,
        region: "intl",
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
            rows: simulatedCryptoSectorQuotes(sector),
            simulated: true,
            partial: false,
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
    `market-gateway:related-news:${limit}:v2`,
    CACHE_TTL.relatedNewsMs,
    async () => {
      const articles = await fetchAggregatedNews(limit);
      if (articles.length > 0) {
        noteMarketProviderUsage("rss_public");
      }
      return articles;
    },
    {
      shortTtlMs: 30_000,
      shouldRetain: (articles) => articles.length > 0,
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
        rows: sortQuotesForDesk(simulatedEquities()),
        simulated: true,
        partial: false,
        warning: "equities_fallback_budget",
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
        rows: simulatedCryptoQuotes(),
        simulated: true,
        partial: false,
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

    const budgetWarning = getMarketProviderBudgetWarning(provider);
    if (budgetWarning) {
      warnings.push(budgetWarning);
      continue;
    }

    try {
      const result = await execute();
      noteMarketProviderUsage(provider);
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
