import { computeAssetDossierHistoricalInsights } from "@/lib/market/asset-dossier-historical-insights";
import { getAssetReferenceProfile } from "@/lib/market/asset-reference-profiles";
import {
  simulatedB3EquitiesForSymbols,
  simulatedIntlEquitiesForSymbols,
} from "@/lib/market/equities-sim";
import {
  fetchIntlCompanyProfileFromFmp,
  fetchIntlKeyMetricsTtmFromFmp,
  fetchIntlLatestAnnualStatementsFromFmp,
  fetchIntlStockPeersFromFmp,
  type IntlCompanyProfile,
} from "@/lib/market/financial-modeling-prep";
import { loadCachedAggregatedNews } from "@/lib/market/market-data-gateway";
import {
  canUseMarketProvider,
  noteMarketProviderUsage,
} from "@/lib/market/market-provider-budget";
import { rememberWithTtl } from "@/lib/market/market-server-cache";
import { SECTOR_ORDER, listSectorSymbols, type SectorId } from "@/lib/market/sector-universe";
import type {
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
  profile: IntlCompanyProfile | null;
  intlKeyMetricsTtm: IntlKeyMetricsTtm | null;
  intlAnnualStatements: IntlAnnualStatementsSnapshot | null;
  intlStockPeers: string[] | null;
};

const DOSSIER_TTL_MS = 5 * 60_000;

export async function loadAssetDossier(symbolInput: string): Promise<AssetDossier | null> {
  const symbol = normalizeSymbol(symbolInput);
  if (!symbol) return null;

  return rememberWithTtl(`asset-dossier:${symbol}:v6`, DOSSIER_TTL_MS, async () => {
    const region = detectAssetRegion(symbol);
    const [market, articles] = await Promise.all([
      region === "br" ? fetchBrAssetDossier(symbol) : fetchIntlAssetDossier(symbol),
      loadCachedAggregatedNews(72).catch(() => [] as NewsArticle[]),
    ]);

    const reference = getAssetReferenceProfile(symbol);
    const inferredSector = inferSectorName(symbol, region);
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
    const relatedNews = pickRelatedNews(articles, keywords).slice(0, 6);
    const historicalInsights = computeAssetDossierHistoricalInsights(market.history);

    return {
      symbol,
      region,
      historyMode: market.historyMode,
      quote: {
        ...market.quote,
        imageUrl: market.quote.imageUrl ?? market.profile?.imageUrl ?? undefined,
      },
      companyName,
      currency: market.quote.currency ?? (region === "br" ? "BRL" : "USD"),
      foundedYear: reference?.foundedYear ?? null,
      headquarters: reference?.headquarters ?? market.profile?.headquarters ?? null,
      country: market.profile?.country ?? extractCountry(reference?.headquarters) ?? null,
      exchange: market.profile?.exchange ?? null,
      website: market.profile?.website ?? null,
      ipoDate: market.profile?.ipoDate ?? null,
      sector: reference?.sector ?? market.profile?.sector ?? inferredSector,
      industry: reference?.industry ?? market.profile?.industry ?? null,
      ceoName: market.profile?.ceoName ?? null,
      fullTimeEmployees: market.profile?.fullTimeEmployees ?? null,
      intlStockPeers: region === "intl" ? market.intlStockPeers : null,
      summary:
        reference?.summary ??
        market.profile?.summary ??
        buildFallbackSummary(
          companyName,
          reference?.sector ?? market.profile?.sector ?? inferredSector,
          region,
          market.quote,
        ),
      keywords,
      sourceLabel: region === "br" ? "BRAPI" : market.profile?.sourceLabel ?? "Yahoo Finance + PRONUX model",
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
    };
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
  const url = `${base}&range=10y&interval=1d`;

  try {
    if (!canUseMarketProvider("brapi")) {
      throw new Error("brapi_budget_soft_cap");
    }

    const res = await fetch(url, {
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
    const output = {
      quote,
      history: history.length > 1 ? history : buildIndicativeHistory(quote, "br"),
      historyMode: history.length > 1 ? ("live" as const) : ("indicative" as const),
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
      profile: null,
      intlKeyMetricsTtm: null,
      intlAnnualStatements: null,
      intlStockPeers: null,
    };
    noteMarketProviderUsage("brapi");
    return output;
  } catch {
    const fallback = simulatedB3EquitiesForSymbols([symbol])[0] ?? {
      symbol,
      shortName: symbol,
      currency: "BRL",
      regularMarketPrice: null,
      regularMarketChange: null,
      regularMarketChangePercent: null,
      segment: "equity" as const,
    };
    return {
      quote: fallback,
      history: buildIndicativeHistory(fallback, "br"),
      historyMode: "indicative" as const,
      fields: emptyDetailedFields(),
      profile: null,
      intlKeyMetricsTtm: null,
      intlAnnualStatements: null,
      intlStockPeers: null,
    };
  }
}

async function fetchIntlAssetDossier(symbol: string): Promise<MarketDossierSnapshot> {
  const [profile, intlKeyMetricsTtm, intlAnnualStatements, intlStockPeers] = await Promise.all([
    fetchIntlCompanyProfileFromFmp(symbol),
    fetchIntlKeyMetricsTtmFromFmp(symbol),
    fetchIntlLatestAnnualStatementsFromFmp(symbol),
    fetchIntlStockPeersFromFmp(symbol),
  ]);

  try {
    if (!canUseMarketProvider("yahoo")) {
      throw new Error("yahoo_budget_soft_cap");
    }

    const quoteRes = await fetch(
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
    noteMarketProviderUsage("yahoo");
    return {
      quote,
      history: liveHistory.length > 1 ? liveHistory : buildIndicativeHistory(quote, "intl"),
      historyMode: liveHistory.length > 1 ? ("live" as const) : ("indicative" as const),
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
    const fallback = simulatedIntlEquitiesForSymbols([symbol])[0] ?? {
      symbol,
      shortName: symbol,
      currency: "USD",
      regularMarketPrice: null,
      regularMarketChange: null,
      regularMarketChangePercent: null,
      segment: "equity" as const,
    };
    return {
      quote: fallback,
      history: buildIndicativeHistory(fallback, "intl"),
      historyMode: "indicative" as const,
      fields: emptyDetailedFields(),
      profile,
      intlKeyMetricsTtm,
      intlAnnualStatements,
      intlStockPeers,
    };
  }
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
    const res = await fetch(
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
  region: "br" | "intl",
): AssetHistoryPoint[] {
  const steps = 60;
  const now = Date.now();
  const seed = symbolSeed(quote.symbol);
  const price = quote.regularMarketPrice ?? (region === "br" ? 32 : 78);
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
  region: "br" | "intl",
  quote?: QuoteSnapshot,
) {
  const scope =
    region === "br"
      ? "na cobertura institucional do mercado brasileiro"
      : "na cobertura internacional da PRONUXFIN";
  const body = !sector
    ? `${name} integra a mesa aprofundada de ativos da PRONUXFIN, com foco em contexto de mercado, movimentos recentes e leitura operacional ${scope}.`
    : `${name} aparece na camada aprofundada de ativos da PRONUXFIN como representante de ${sector.toLowerCase()}, combinando contexto operacional, movimentos recentes e monitoramento ${scope}.`;

  const cur = quote?.currency ?? (region === "br" ? "BRL" : "USD");
  const iso = /^[A-Z]{3}$/i.test(cur) ? cur.toUpperCase() : region === "br" ? "BRL" : "USD";
  const px = quote?.regularMarketPrice;
  const chg = quote?.regularMarketChangePercent;
  if (px == null || !Number.isFinite(px)) return body;

  const loc = region === "br" ? "pt-BR" : "en-US";
  const formatted = new Intl.NumberFormat(loc, {
    style: "currency",
    currency: iso,
    maximumFractionDigits: 2,
  }).format(px);

  let priceBit: string;
  if (chg != null && Number.isFinite(chg)) {
    const sign = chg > 0 ? "+" : "";
    priceBit =
      region === "br"
        ? `Cotação recente na mesa: ${formatted} (${sign}${chg.toFixed(2)}% nesta leitura).`
        : `Latest desk quote: ${formatted} (${sign}${chg.toFixed(2)}% this read).`;
  } else {
    priceBit =
      region === "br"
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

function inferSectorName(symbol: string, region: "br" | "intl") {
  const sector = inferSectorId(symbol, region);
  if (!sector) return null;
  return SECTOR_LABELS[sector];
}

function inferSectorId(symbol: string, region: "br" | "intl"): SectorId | null {
  for (const sector of SECTOR_ORDER) {
    if (listSectorSymbols(region, sector).includes(symbol)) {
      return sector;
    }
  }
  return null;
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
