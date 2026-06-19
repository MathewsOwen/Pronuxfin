import { fetchMarket } from "@/lib/http/fetch-with-timeout";
import { safeExternalUrl } from "@/lib/http/safe-external-url";
import { computeAssetDossierHistoricalInsights } from "@/lib/market/asset-dossier-historical-insights";
import { extractMarketExtrasFromQuoteRow } from "@/lib/market/asset-dossier-market-extras";
import {
  buildAssetDividendInsights,
  parseBrapiDividendEvents,
  parseFmpDividendEvents,
} from "@/lib/market/asset-dossier-dividends";
import { computeAssetDossierPeriodStats } from "@/lib/market/asset-dossier-period-stats";
import {
  listSectorPeersForSymbol,
  mergeComparablePeers,
} from "@/lib/market/asset-dossier-sector-peers";
import {
  detectAssetClass,
  detectDeskMarketFromSymbol,
  inferEquitySectorId,
  resolveLegacyEquityRegion,
} from "@/lib/market/asset-class";
import { loadCryptoAssetDossier } from "@/lib/market/load-crypto-asset-dossier";
import { resolveFmpEquitySymbol } from "@/lib/market/fmp-symbol-resolver";
import { getAssetReferenceProfile } from "@/lib/market/asset-reference-profiles";
import {
  fetchIntlCompanyProfileFromFmp,
  fetchIntlKeyMetricsTtmFromFmp,
  fetchIntlLatestAnnualStatementsFromFmp,
  fetchIntlStockPeersFromFmp,
  fetchStockDividendHistoryFromFmp,
  type IntlCompanyProfile,
} from "@/lib/market/financial-modeling-prep";
import { loadCachedAggregatedNews } from "@/lib/market/market-data-gateway";
import {
  canUseMarketProvider,
  noteMarketProviderUsage,
} from "@/lib/market/market-provider-budget";
import { enrichAssetDossier } from "@/lib/market/asset-dossier-enrichment";
import { rememberWithTtl } from "@/lib/market/market-server-cache";
import type { SectorId } from "@/lib/market/sector-universe";
import {
  deskMarketDefaultCurrency,
  DESK_MARKET_META,
  type DeskMarketId,
} from "@/lib/market/world-markets";
import type {
  AssetDividendEvent,
  AssetDossier,
  AssetHistoryPoint,
  AssetMoveSnapshot,
  IntlAnnualStatementsSnapshot,
  IntlKeyMetricsTtm,
  NewsArticle,
  QuoteSnapshot,
} from "@/lib/market/types";

type BrapiHistoryRow = {
  date?: number;
  close?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  adjustedClose?: number;
};

type DetailedQuoteFields = {
  marketCap: number | null;
  regularMarketVolume: number | null;
  regularMarketOpen: number | null;
  regularMarketPreviousClose: number | null;
  regularMarketDayHigh: number | null;
  regularMarketDayLow: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  priceEarnings: number | null;
  earningsPerShare: number | null;
};

type MarketDossierSnapshot = {
  quote: QuoteSnapshot;
  history: AssetHistoryPoint[];
  historyMode: "live" | "indicative";
  fields: DetailedQuoteFields;
  marketExtras: ReturnType<typeof extractMarketExtrasFromQuoteRow>;
  dividendEvents: AssetDividendEvent[];
  dividendSourceLabel: string;
  profile: IntlCompanyProfile | null;
  intlKeyMetricsTtm: IntlKeyMetricsTtm | null;
  intlAnnualStatements: IntlAnnualStatementsSnapshot | null;
  intlStockPeers: string[] | null;
};

const DOSSIER_TTL_MS = 3 * 60_000;

export async function loadAssetDossier(symbolInput: string): Promise<AssetDossier | null> {
  const symbol = normalizeSymbol(symbolInput);
  if (!symbol) return null;

  if (detectAssetClass(symbol) === "crypto") {
    return loadCryptoAssetDossier(symbol);
  }

  return rememberWithTtl(`asset-dossier:${symbol}:v12`, DOSSIER_TTL_MS, async () => {
    const deskMarket = detectDeskMarketFromSymbol(symbol);
    const region = resolveLegacyEquityRegion(symbol);
    const [market, articles] = await Promise.all([
      deskMarket === "br" ? fetchBrAssetDossier(symbol) : fetchIntlAssetDossier(symbol, deskMarket),
      loadCachedAggregatedNews(72).catch(() => [] as NewsArticle[]),
    ]);

    const reference = getAssetReferenceProfile(symbol);
    const inferredSector = inferSectorName(symbol);
    const sectorLabel = inferredSector ?? market.profile?.sector ?? reference?.sector ?? null;
    const companyName =
      reference?.companyName ??
      market.profile?.companyName ??
      market.quote.shortName ??
      market.quote.symbol;
    const keywords = buildAssetKeywords(
      symbol,
      market.quote.shortName,
      companyName,
      reference?.keywords,
      reference?.aliases,
    );
    const relatedNews = pickRelatedNews(articles, keywords).slice(0, 16);
    const historicalInsights = computeAssetDossierHistoricalInsights(market.history);
    const periodStats = computeAssetDossierPeriodStats(
      market.history,
      market.quote.regularMarketPrice,
      market.fields.fiftyTwoWeekHigh,
      market.fields.fiftyTwoWeekLow,
    );
    const sectorPeers = listSectorPeersForSymbol(symbol, deskMarket);
    const comparablePeers = mergeComparablePeers(symbol, sectorPeers, market.intlStockPeers);
    const marketExtras = {
      ...market.marketExtras,
      ceoName: market.profile?.ceoName ?? market.marketExtras.ceoName ?? null,
      fullTimeEmployees:
        market.profile?.fullTimeEmployees ?? market.marketExtras.fullTimeEmployees ?? null,
    };
    const dividends = buildAssetDividendInsights(
      market.dividendEvents,
      market.dividendSourceLabel,
      market.quote.regularMarketPrice,
      market.intlKeyMetricsTtm?.dividendYield ?? marketExtras.dividendYield ?? null,
      market.history,
    );

    return enrichAssetDossier({
      symbol,
      assetClass: "equity",
      deskMarket,
      region,
      historyMode: market.historyMode,
      quote: {
        ...market.quote,
        imageUrl: market.quote.imageUrl ?? market.profile?.imageUrl ?? undefined,
      },
      companyName,
      currency:
        market.quote.currency ??
        deskMarketDefaultCurrency(deskMarket),
      foundedYear: reference?.foundedYear ?? null,
      headquarters: reference?.headquarters ?? market.profile?.headquarters ?? null,
      country: market.profile?.country ?? extractCountry(reference?.headquarters) ?? null,
      exchange: market.profile?.exchange ?? null,
      website: market.profile?.website ?? null,
      ipoDate: market.profile?.ipoDate ?? null,
      sector: reference?.sector ?? market.profile?.sector ?? sectorLabel,
      industry: reference?.industry ?? market.profile?.industry ?? null,
      ceoName: market.profile?.ceoName ?? marketExtras.ceoName ?? null,
      fullTimeEmployees: market.profile?.fullTimeEmployees ?? marketExtras.fullTimeEmployees ?? null,
      intlStockPeers: deskMarket === "br" ? null : market.intlStockPeers,
      comparablePeers,
      marketExtras,
      periodStats,
      dividends,
      summary:
        reference?.summary ??
        market.profile?.summary ??
        buildFallbackSummary(companyName, sectorLabel, deskMarket, market.quote),
      keywords,
      sourceLabel:
        deskMarket === "br"
          ? "BRAPI"
          : (market.profile?.sourceLabel ??
            `Yahoo Finance + FMP · ${DESK_MARKET_META[deskMarket].exchangeLabelEn}`),
      marketCap: market.fields.marketCap,
      regularMarketVolume: market.fields.regularMarketVolume,
      regularMarketOpen: market.fields.regularMarketOpen,
      regularMarketPreviousClose: market.fields.regularMarketPreviousClose,
      regularMarketDayHigh: market.fields.regularMarketDayHigh,
      regularMarketDayLow: market.fields.regularMarketDayLow,
      fiftyTwoWeekHigh: market.fields.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: market.fields.fiftyTwoWeekLow,
      priceEarnings: market.fields.priceEarnings,
      earningsPerShare: market.fields.earningsPerShare,
      history: market.history,
      bestMove: computeExtremeMove(market.history, "best"),
      worstMove: computeExtremeMove(market.history, "worst"),
      relatedNews,
      intlKeyMetricsTtm: market.intlKeyMetricsTtm,
      intlAnnualStatements: market.intlAnnualStatements,
      historicalInsights,
      cryptoProfile: null,
    });
  });
}

function normalizeSymbol(symbol: string) {
  const value = symbol.trim().toUpperCase();
  return /^[A-Z0-9.-]{1,16}$/.test(value) ? value : "";
}

function detectAssetRegion(symbol: string): "br" | "intl" {
  return /\d$/.test(symbol) ? "br" : "intl";
}

async function fetchBrAssetDossier(symbol: string) {
  const token = process.env.BRAPI_TOKEN?.trim();
  const base = token
    ? `https://brapi.dev/api/quote/${symbol}?token=${encodeURIComponent(token)}`
    : `https://brapi.dev/api/quote/${symbol}`;
  const url = `${base}&range=10y&interval=1d&dividends=true&modules=summaryProfile,defaultKeyStatistics,financialData,balanceSheetHistory,incomeStatementHistory,financialStats`;

  try {
    if (!(await canUseMarketProvider("brapi"))) {
      throw new Error("brapi_budget_soft_cap");
    }

    const res = await fetchMarket(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("brapi_quote_failed");

    const json = (await res.json()) as {
      results?: Array<Record<string, unknown> & { historicalDataPrice?: BrapiHistoryRow[] }>;
    };
    const row = json.results?.[0];
    if (!row) throw new Error("brapi_empty");

    const quote = mapBrapiQuote(row);
    const history = mapBrapiHistory(row.historicalDataPrice ?? []);
    const fmpSymbol = `${symbol}.SA`;
    const [fmpProfile, intlKeyMetricsTtm, intlAnnualStatements, intlStockPeers, fmpDividendRows] =
      await Promise.all([
        fetchIntlCompanyProfileFromFmp(fmpSymbol),
        fetchIntlKeyMetricsTtmFromFmp(fmpSymbol),
        fetchIntlLatestAnnualStatementsFromFmp(fmpSymbol),
        fetchIntlStockPeersFromFmp(fmpSymbol),
        fetchStockDividendHistoryFromFmp(fmpSymbol),
      ]);
    const brDividends = parseBrapiDividendEvents(row);
    const dividendBundle = mergeDividendSources(
      brDividends,
      "BRAPI · proventos",
      parseFmpDividendEvents(fmpDividendRows),
    );
    const output = {
      quote,
      history: history.length > 1 ? history : buildIndicativeHistory(quote, "br"),
      historyMode: history.length > 1 ? ("live" as const) : ("indicative" as const),
      marketExtras: extractMarketExtrasFromQuoteRow(row),
      dividendEvents: dividendBundle.events,
      dividendSourceLabel: dividendBundle.sourceLabel,
      fields: {
        marketCap: readNumber(row.marketCap),
        regularMarketVolume: readNumber(row.regularMarketVolume),
        regularMarketOpen: readNumber(row.regularMarketOpen),
        regularMarketPreviousClose: readNumber(row.regularMarketPreviousClose),
        regularMarketDayHigh: readNumber(row.regularMarketDayHigh),
        regularMarketDayLow: readNumber(row.regularMarketDayLow),
        fiftyTwoWeekHigh: readNumber(row.fiftyTwoWeekHigh),
        fiftyTwoWeekLow: readNumber(row.fiftyTwoWeekLow),
        priceEarnings: readNumber(row.priceEarnings),
        earningsPerShare: readNumber(row.earningsPerShare),
      },
      profile: mapBrapiProfile(row) ?? fmpProfile,
      intlKeyMetricsTtm,
      intlAnnualStatements,
      intlStockPeers,
    };
    await noteMarketProviderUsage("brapi");
    return output;
  } catch {
    const quote = emptyQuoteSnapshot(symbol, "BRL");
    return unavailableDossier(quote);
  }
}

function mergeDividendSources(
  primary: AssetDividendEvent[],
  primaryLabel: string,
  fallback: AssetDividendEvent[],
) {
  if (primary.length > 0) {
    return { events: primary, sourceLabel: primaryLabel };
  }
  if (fallback.length > 0) {
    return {
      events: fallback,
      sourceLabel: "Financial Modeling Prep · dividend history",
    };
  }
  return { events: [], sourceLabel: primaryLabel };
}

async function fetchIntlAssetDossier(
  symbol: string,
  deskMarket: DeskMarketId,
): Promise<MarketDossierSnapshot> {
  const fmpSymbol = resolveFmpEquitySymbol(symbol, deskMarket);
  const [profile, intlKeyMetricsTtm, intlAnnualStatements, intlStockPeers, fmpDividendRows] =
    await Promise.all([
      fetchIntlCompanyProfileFromFmp(fmpSymbol),
      fetchIntlKeyMetricsTtmFromFmp(fmpSymbol),
      fetchIntlLatestAnnualStatementsFromFmp(fmpSymbol),
      fetchIntlStockPeersFromFmp(fmpSymbol),
      fetchStockDividendHistoryFromFmp(fmpSymbol),
    ]);
  const fmpDividends = parseFmpDividendEvents(fmpDividendRows);

  try {
    if (!(await canUseMarketProvider("yahoo"))) {
      throw new Error("yahoo_budget_soft_cap");
    }

    const quoteRes = await fetchMarket(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (compatible; PRONUXFIN/1.0; +https://pronux.fin)",
        },
        cache: "no-store",
      },
    );
    if (!quoteRes.ok) throw new Error("yahoo_quote_failed");

    const quoteJson = (await quoteRes.json()) as {
      quoteResponse?: { result?: Array<Record<string, unknown>> };
    };
    const row = quoteJson.quoteResponse?.result?.[0];
    if (!row) throw new Error("yahoo_empty");

    const quote = mapYahooQuote(row);
    const liveHistory = await fetchYahooChartHistory(symbol, "10y");
    const defaultCurrency = deskMarketDefaultCurrency(deskMarket);
    await noteMarketProviderUsage("yahoo");
    return {
      quote: { ...quote, currency: quote.currency ?? defaultCurrency },
      history:
        liveHistory.length > 1
          ? liveHistory
          : buildIndicativeHistory(quote, deskMarket),
      historyMode: liveHistory.length > 1 ? ("live" as const) : ("indicative" as const),
      marketExtras: extractMarketExtrasFromQuoteRow(row),
      dividendEvents: fmpDividends,
      dividendSourceLabel:
        fmpDividends.length > 0
          ? "Financial Modeling Prep · dividend history"
          : "Yahoo Finance",
      fields: {
        marketCap: readNumber(row.marketCap),
        regularMarketVolume: readNumber(row.regularMarketVolume),
        regularMarketOpen: readNumber(row.regularMarketOpen),
        regularMarketPreviousClose: readNumber(row.regularMarketPreviousClose),
        regularMarketDayHigh: readNumber(row.regularMarketDayHigh),
        regularMarketDayLow: readNumber(row.regularMarketDayLow),
        fiftyTwoWeekHigh: readNumber(row.fiftyTwoWeekHigh),
        fiftyTwoWeekLow: readNumber(row.fiftyTwoWeekLow),
        priceEarnings: readNumber(row.trailingPE),
        earningsPerShare: readNumber(row.epsTrailingTwelveMonths),
      },
      profile,
      intlKeyMetricsTtm,
      intlAnnualStatements,
      intlStockPeers,
    };
  } catch {
    const quote = emptyQuoteSnapshot(symbol, deskMarketDefaultCurrency(deskMarket));
    return {
      ...unavailableDossier(quote),
      profile,
      intlKeyMetricsTtm,
      intlAnnualStatements,
      intlStockPeers,
      dividendEvents: fmpDividends,
      dividendSourceLabel:
        fmpDividends.length > 0
          ? "Financial Modeling Prep · dividend history"
          : "Yahoo Finance",
    };
  }
}

function emptyQuoteSnapshot(symbol: string, currency: string): QuoteSnapshot {
  return {
    symbol,
    shortName: symbol,
    currency,
    regularMarketPrice: null,
    regularMarketChange: null,
    regularMarketChangePercent: null,
    segment: "equity",
  };
}

function unavailableDossier(quote: QuoteSnapshot) {
  return {
    quote,
    history: [] as AssetHistoryPoint[],
    historyMode: "indicative" as const,
    marketExtras: emptyMarketExtras(),
    dividendEvents: [] as AssetDividendEvent[],
    dividendSourceLabel: "—",
    fields: emptyDetailedFields(),
    profile: null,
    intlKeyMetricsTtm: null,
    intlAnnualStatements: null,
    intlStockPeers: null,
  };
}

function emptyMarketExtras() {
  return extractMarketExtrasFromQuoteRow({});
}

function mapBrapiProfile(row: Record<string, unknown>): IntlCompanyProfile | null {
  const summaryProfile =
    row.summaryProfile && typeof row.summaryProfile === "object"
      ? (row.summaryProfile as Record<string, unknown>)
      : null;

  const companyName =
    readString(row.longName) ??
    readString(row.shortName) ??
    readString(summaryProfile?.companyName);
  if (!companyName) return null;

  const city = readString(summaryProfile?.city);
  const state = readString(summaryProfile?.state);
  const headquarters =
    city && state ? `${city}, ${state}` : city ?? state ?? readString(summaryProfile?.address);

  return {
    companyName,
    summary: readString(summaryProfile?.description) ?? readString(row.description),
    sector: readString(summaryProfile?.sector) ?? readString(row.sector),
    industry: readString(summaryProfile?.industry) ?? readString(row.industry),
    headquarters,
    country: readString(summaryProfile?.country) ?? "Brasil",
    exchange: readString(summaryProfile?.exchange) ?? "B3",
    website: safeExternalUrl(readString(summaryProfile?.website) ?? undefined),
    imageUrl: readString(row.logourl) ?? readString(summaryProfile?.image),
    ipoDate: readString(summaryProfile?.ipoDate),
    ceoName: readString(summaryProfile?.ceo),
    fullTimeEmployees: readNumber(summaryProfile?.fullTimeEmployees),
    sourceLabel: "BRAPI",
  };
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapBrapiQuote(row: Record<string, unknown>): QuoteSnapshot {
  return {
    symbol: String(row.symbol ?? "").trim().toUpperCase(),
    shortName:
      typeof row.longName === "string"
        ? row.longName
        : typeof row.shortName === "string"
          ? row.shortName
          : undefined,
    currency: typeof row.currency === "string" ? row.currency : "BRL",
    regularMarketPrice: readNumber(row.regularMarketPrice),
    regularMarketChange: readNumber(row.regularMarketChange),
    regularMarketChangePercent: readNumber(row.regularMarketChangePercent),
    regularMarketVolume: readNumber(row.regularMarketVolume),
    imageUrl: typeof row.logourl === "string" ? row.logourl : undefined,
    marketTime:
      typeof row.regularMarketTime === "string"
        ? row.regularMarketTime
        : undefined,
    segment: "equity",
  };
}

function mapYahooQuote(row: Record<string, unknown>): QuoteSnapshot {
  return {
    symbol: String(row.symbol ?? "").trim().toUpperCase(),
    shortName:
      typeof row.longName === "string"
        ? row.longName
        : typeof row.shortName === "string"
          ? row.shortName
          : undefined,
    currency: typeof row.currency === "string" ? row.currency : "USD",
    regularMarketPrice: readNumber(row.regularMarketPrice),
    regularMarketChange: readNumber(row.regularMarketChange),
    regularMarketChangePercent: readNumber(row.regularMarketChangePercent),
    regularMarketVolume: readNumber(row.regularMarketVolume),
    marketTime:
      typeof row.regularMarketTime === "number"
        ? new Date(row.regularMarketTime * 1000).toISOString()
        : undefined,
    segment: "equity",
  };
}

function mapBrapiHistory(rows: BrapiHistoryRow[]): AssetHistoryPoint[] {
  const output: AssetHistoryPoint[] = [];
  for (const row of rows) {
      const close = readNumber(row.close);
      const date = typeof row.date === "number" ? new Date(row.date * 1000) : null;
      if (!date || close == null) continue;
      output.push({
        date: date.toISOString(),
        close,
        open: readNumber(row.open),
        high: readNumber(row.high),
        low: readNumber(row.low),
        volume: readNumber(row.volume),
      });
  }
  return output;
}

async function fetchYahooChartHistory(
  symbol: string,
  range: string = "10y",
): Promise<AssetHistoryPoint[]> {
  try {
    const res = await fetchMarket(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${encodeURIComponent(range)}&interval=1d`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (compatible; PRONUXFIN/1.0; +https://pronux.fin)",
        },
        cache: "no-store",
      },
    );
    if (!res.ok) return [];

    const json = (await res.json()) as {
      chart?: {
        result?: Array<{
          timestamp?: number[];
          indicators?: {
            quote?: Array<{
              close?: Array<number | null>;
              open?: Array<number | null>;
              high?: Array<number | null>;
              low?: Array<number | null>;
              volume?: Array<number | null>;
            }>;
          };
        }>;
      };
    };

    const result = json.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const quote = result?.indicators?.quote?.[0];
    if (!quote || timestamps.length === 0) return [];

    const output: AssetHistoryPoint[] = [];
    for (const [index, timestamp] of timestamps.entries()) {
      const close = quote.close?.[index] ?? null;
      if (close == null) continue;
      output.push({
          date: new Date(timestamp * 1000).toISOString(),
          close,
          open: quote.open?.[index] ?? null,
          high: quote.high?.[index] ?? null,
          low: quote.low?.[index] ?? null,
          volume: quote.volume?.[index] ?? null,
        });
    }
    return output;
  } catch {
    return [];
  }
}

function buildIndicativeHistory(
  quote: QuoteSnapshot,
  market: DeskMarketId,
): AssetHistoryPoint[] {
  const steps = 60;
  const now = Date.now();
  const seed = symbolSeed(quote.symbol);
  const price = quote.regularMarketPrice ?? (market === "br" ? 32 : 78);
  const pct = quote.regularMarketChangePercent ?? 0;
  const baseDrift = pct / 100;
  const rows: AssetHistoryPoint[] = [];

  for (let i = steps - 1; i >= 0; i--) {
    const oscillation =
      Math.sin(seed * 0.13 + i * 0.32) * 0.024 +
      Math.cos(seed * 0.07 + i * 0.17) * 0.012;
    const drift = baseDrift * ((steps - i) / steps) * 0.8;
    const close = Math.max(price * (1 - drift - oscillation), 0.5);
    rows.push({
      date: new Date(now - i * 86_400_000).toISOString(),
      close: Number(close.toFixed(2)),
      volume: null,
    });
  }

  return rows;
}

function computeExtremeMove(
  history: AssetHistoryPoint[],
  mode: "best" | "worst",
): AssetMoveSnapshot | null {
  let best: AssetMoveSnapshot | null = null;

  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1]?.close;
    const current = history[i]?.close;
    if (!prev || !current) continue;
    const percent = ((current - prev) / prev) * 100;
    if (!best) {
      best = { date: history[i]!.date, percent, close: current };
      continue;
    }
    if (mode === "best" ? percent > best.percent : percent < best.percent) {
      best = { date: history[i]!.date, percent, close: current };
    }
  }

  return best;
}

function pickRelatedNews(articles: NewsArticle[], keywords: string[]) {
  return articles
    .map((article) => ({
      article,
      score: scoreArticle(article, keywords),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ta = a.article.publishedAt ? new Date(a.article.publishedAt).getTime() : 0;
      const tb = b.article.publishedAt ? new Date(b.article.publishedAt).getTime() : 0;
      return tb - ta;
    })
    .map((row) => row.article);
}

function scoreArticle(article: NewsArticle, keywords: string[]) {
  const title = normalizeText(article.title);
  const summary = normalizeText(article.summary);
  let score = 0;
  for (const keyword of keywords) {
    if (keyword.length < 3) continue;
    if (title.includes(keyword)) score += 4;
    if (summary.includes(keyword)) score += 2;
  }
  return score;
}

function buildAssetKeywords(
  symbol: string,
  shortName?: string,
  companyName?: string,
  referenceKeywords?: string[],
  aliases?: string[],
) {
  const baseTicker = symbol.replace(/\d+$/, "");
  const tokens = [
    symbol,
    baseTicker,
    ...(shortName ? tokenizeWords(shortName) : []),
    ...(companyName ? tokenizeWords(companyName) : []),
    ...(referenceKeywords ?? []),
    ...(aliases ?? []),
  ];
  return [...new Set(tokens.map(normalizeText).filter((token) => token.length >= 3))];
}

function tokenizeWords(value: string) {
  return value
    .split(/[\s,/()-]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !STOP_WORDS.has(normalizeText(token)));
}

function buildFallbackSummary(
  name: string,
  sector: string | null,
  market: DeskMarketId,
  quote?: QuoteSnapshot,
) {
  const meta = DESK_MARKET_META[market];
  const scope =
    market === "br"
      ? "na cobertura institucional do mercado brasileiro"
      : `na cobertura internacional da PRONUXFIN (${meta.namePt} · ${meta.exchangeLabelPt})`;
  const body = !sector
    ? `${name} integra a mesa aprofundada de ativos da PRONUXFIN, com foco em contexto de mercado, movimentos recentes e leitura operacional ${scope}.`
    : `${name} aparece na camada aprofundada de ativos da PRONUXFIN como representante de ${sector.toLowerCase()}, combinando contexto operacional, movimentos recentes e monitoramento ${scope}.`;

  const cur = quote?.currency ?? deskMarketDefaultCurrency(market);
  const iso = /^[A-Z]{3}$/i.test(cur) ? cur.toUpperCase() : deskMarketDefaultCurrency(market);
  const px = quote?.regularMarketPrice;
  const chg = quote?.regularMarketChangePercent;
  if (px == null || !Number.isFinite(px)) return body;

  const loc = market === "br" ? "pt-BR" : "en-US";
  const formatted = new Intl.NumberFormat(loc, {
    style: "currency",
    currency: iso,
    maximumFractionDigits: 2,
  }).format(px);

  let priceBit: string;
  if (chg != null && Number.isFinite(chg)) {
    const sign = chg > 0 ? "+" : "";
    priceBit =
      market === "br"
        ? `Cotação recente na mesa: ${formatted} (${sign}${chg.toFixed(2)}% nesta leitura).`
        : `Latest desk quote: ${formatted} (${sign}${chg.toFixed(2)}% this read).`;
  } else {
    priceBit =
      market === "br"
        ? `Última cotação registada na mesa: ${formatted}.`
        : `Latest desk quote on file: ${formatted}.`;
  }

  return `${body} ${priceBit}`;
}

function extractCountry(headquarters?: string) {
  if (!headquarters) return null;
  const parts = headquarters.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.at(-1) ?? null;
}

function inferSectorName(symbol: string) {
  const sector = inferEquitySectorId(symbol);
  if (!sector) return null;
  return SECTOR_LABELS[sector];
}

function emptyDetailedFields(): DetailedQuoteFields {
  return {
    marketCap: null,
    regularMarketVolume: null,
    regularMarketOpen: null,
    regularMarketPreviousClose: null,
    regularMarketDayHigh: null,
    regularMarketDayLow: null,
    fiftyTwoWeekHigh: null,
    fiftyTwoWeekLow: null,
    priceEarnings: null,
    earningsPerShare: null,
  };
}

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function symbolSeed(symbol: string) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (Math.imul(31, hash) + symbol.charCodeAt(i)) | 0;
  }
  return Math.abs(hash || 1);
}

const STOP_WORDS = new Set([
  "sa",
  "s.a",
  "inc",
  "corp",
  "adr",
  "pfd",
  "on",
  "pn",
  "de",
  "do",
  "da",
  "and",
  "the",
]);

const SECTOR_LABELS: Record<SectorId, string> = {
  commodities: "Commodities",
  technology: "Technology",
  oil_gas: "Oil & Gas",
  defense_aerospace: "Defense & Aerospace",
  financials: "Financials",
  healthcare: "Healthcare",
  consumer: "Consumer",
  utilities: "Utilities",
  industrials: "Industrials",
};
