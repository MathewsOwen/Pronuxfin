import { fetchMarket } from "@/lib/http/fetch-with-timeout";
import { safeExternalUrl } from "@/lib/http/safe-external-url";
import { computeAssetDossierHistoricalInsights } from "@/lib/market/asset-dossier-historical-insights";
import { computeAssetDossierPeriodStats } from "@/lib/market/asset-dossier-period-stats";
import {
  findCryptoAssetBySymbol,
  inferCryptoSectorId,
  listCryptoSectorPeers,
} from "@/lib/market/crypto-coin-registry";
import { loadCachedAggregatedNews } from "@/lib/market/market-data-gateway";
import {
  canUseMarketProvider,
  noteMarketProviderUsage,
} from "@/lib/market/market-provider-budget";
import { rememberWithTtl } from "@/lib/market/market-server-cache";
import type {
  AssetDossier,
  AssetHistoryPoint,
  AssetMoveSnapshot,
  CryptoDossierProfile,
  NewsArticle,
  QuoteSnapshot,
} from "@/lib/market/types";

const COINGECKO_UA =
  "PRONUXFIN/1.0 (+https://pronuxfin.com.br; dossiê cripto CoinGecko)";

type CoinGeckoSearchCoin = {
  id?: string;
  symbol?: string;
  name?: string;
};

type CoinGeckoDetail = {
  id?: string;
  symbol?: string;
  name?: string;
  description?: Record<string, string>;
  links?: {
    homepage?: string[];
    blockchain_site?: string[];
    repos_url?: { github?: string[] };
  };
  image?: { large?: string; small?: string };
  genesis_date?: string | null;
  hashing_algorithm?: string | null;
  categories?: string[];
  market_data?: {
    current_price?: Record<string, number>;
    market_cap?: Record<string, number>;
    total_volume?: Record<string, number>;
    high_24h?: Record<string, number>;
    low_24h?: Record<string, number>;
    price_change_percentage_24h?: number;
    price_change_percentage_7d?: number;
    price_change_percentage_30d?: number;
    price_change_percentage_1y?: number;
    ath?: Record<string, number>;
    ath_date?: Record<string, string>;
    atl?: Record<string, number>;
    atl_date?: Record<string, string>;
    circulating_supply?: number;
    total_supply?: number;
    max_supply?: number | null;
    fully_diluted_valuation?: Record<string, number>;
    market_cap_rank?: number;
    last_updated?: string;
  };
  community_data?: {
    twitter_followers?: number | null;
    reddit_subscribers?: number | null;
  };
  developer_data?: {
    forks?: number | null;
    stars?: number | null;
    commit_count_4_weeks?: number | null;
  };
};

async function resolveCoinGeckoId(symbol: string): Promise<string | null> {
  const known = findCryptoAssetBySymbol(symbol);
  if (known) return known.id;

  try {
    const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(symbol)}`;
    const res = await fetchMarket(url, {
      headers: { Accept: "application/json", "User-Agent": COINGECKO_UA },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { coins?: CoinGeckoSearchCoin[] };
    const upper = symbol.trim().toUpperCase();
    const exact = json.coins?.find((c) => c.symbol?.toUpperCase() === upper);
    return exact?.id ?? json.coins?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function fetchCoinGeckoDetail(coinId: string): Promise<CoinGeckoDetail | null> {
  const url =
    `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}` +
    `?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true&sparkline=false`;
  const res = await fetchMarket(url, {
    headers: { Accept: "application/json", "User-Agent": COINGECKO_UA },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as CoinGeckoDetail;
}

async function fetchCoinGeckoHistory(coinId: string): Promise<AssetHistoryPoint[]> {
  const url =
    `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}/market_chart` +
    `?vs_currency=brl&days=max&interval=daily`;
  const res = await fetchMarket(url, {
    headers: { Accept: "application/json", "User-Agent": COINGECKO_UA },
    cache: "no-store",
  });
  if (!res.ok) return [];

  const json = (await res.json()) as {
    prices?: Array<[number, number]>;
    total_volumes?: Array<[number, number]>;
  };

  const prices = json.prices ?? [];
  const volumes = json.total_volumes ?? [];
  const volumeByTs = new Map(volumes.map(([ts, vol]) => [ts, vol]));

  const output: AssetHistoryPoint[] = [];
  for (const [ts, close] of prices) {
    if (!Number.isFinite(ts) || !Number.isFinite(close)) continue;
    output.push({
      date: new Date(ts).toISOString(),
      close,
      volume: volumeByTs.get(ts) ?? null,
    });
  }
  return output;
}

function readLocalizedDescription(detail: CoinGeckoDetail): string | null {
  const desc = detail.description;
  if (!desc || typeof desc !== "object") return null;
  const text = desc.pt ?? desc.en ?? Object.values(desc).find((v) => v?.trim());
  if (!text) return null;
  const stripped = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!stripped) return null;
  return stripped.length > 680 ? `${stripped.slice(0, 679)}…` : stripped;
}

function brl(
  detail: CoinGeckoDetail,
  key: "current_price" | "market_cap" | "total_volume" | "high_24h" | "low_24h" | "ath" | "atl" | "fully_diluted_valuation",
): number | null {
  const bag = detail.market_data?.[key];
  if (!bag || typeof bag !== "object") return null;
  const v = (bag as Record<string, number>).brl;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function buildCryptoProfile(detail: CoinGeckoDetail, coinId: string, symbol: string): CryptoDossierProfile {
  const md = detail.market_data;
  const athDateRaw = md?.ath_date?.brl;
  const atlDateRaw = md?.atl_date?.brl;
  const homepage = detail.links?.homepage?.find((u) => u?.trim()) ?? null;

  return {
    coinGeckoId: coinId,
    categories: detail.categories ?? [],
    genesisDate: detail.genesis_date ?? null,
    hashingAlgorithm: detail.hashing_algorithm ?? null,
    homepageUrl: safeExternalUrl(homepage ?? undefined),
    blockchainUrls: (detail.links?.blockchain_site ?? [])
      .map((u) => safeExternalUrl(u))
      .filter((u): u is string => Boolean(u))
      .slice(0, 4),
    githubUrl: safeExternalUrl(detail.links?.repos_url?.github?.[0]),
    twitterFollowers: detail.community_data?.twitter_followers ?? null,
    redditSubscribers: detail.community_data?.reddit_subscribers ?? null,
    githubStars: detail.developer_data?.stars ?? null,
    githubForks: detail.developer_data?.forks ?? null,
    commitCount4Weeks: detail.developer_data?.commit_count_4_weeks ?? null,
    circulatingSupply: md?.circulating_supply ?? null,
    totalSupply: md?.total_supply ?? null,
    maxSupply: md?.max_supply ?? null,
    fullyDilutedValuation: brl(detail, "fully_diluted_valuation"),
    athPrice: brl(detail, "ath"),
    athDate: athDateRaw ? new Date(athDateRaw).toISOString() : null,
    atlPrice: brl(detail, "atl"),
    atlDate: atlDateRaw ? new Date(atlDateRaw).toISOString() : null,
    priceChange7d: md?.price_change_percentage_7d ?? null,
    priceChange30d: md?.price_change_percentage_30d ?? null,
    priceChange1y: md?.price_change_percentage_1y ?? null,
    marketCapRank: md?.market_cap_rank ?? null,
    cryptoSector: inferCryptoSectorId(symbol),
    sourceLabel: "CoinGecko",
  };
}

function mapCryptoQuote(detail: CoinGeckoDetail, symbol: string): QuoteSnapshot {
  const md = detail.market_data;
  const price = brl(detail, "current_price");
  const pct = md?.price_change_percentage_24h ?? null;
  let change: number | null = null;
  if (price != null && pct != null && Number.isFinite(price) && Number.isFinite(pct)) {
    const prev = price / (1 + pct / 100);
    change = Number((price - prev).toFixed(2));
  }

  return {
    symbol: symbol.trim().toUpperCase(),
    shortName: detail.name ?? symbol,
    currency: "BRL",
    regularMarketPrice: price,
    regularMarketChange: change,
    regularMarketChangePercent: pct,
    regularMarketVolume: brl(detail, "total_volume"),
    imageUrl: detail.image?.large ?? detail.image?.small,
    marketCapRank: md?.market_cap_rank ?? null,
    marketTime: md?.last_updated ?? undefined,
    segment: "crypto",
  };
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
  const normalized = keywords.map((k) => k.toLowerCase());
  return articles
    .filter((article) => {
      const hay = `${article.title} ${article.summary}`.toLowerCase();
      return normalized.some((k) => k.length >= 3 && hay.includes(k));
    })
    .slice(0, 16);
}

function emptyDividends(): import("@/lib/market/types").AssetDividendInsights {
  return {
    events: [],
    trailing12mTotal: null,
    trailing12mYield: null,
    paymentsLast12m: 0,
    paymentsLast24m: 0,
    nextPayment: null,
    dividendYieldSnapshot: null,
    byYear: [],
    yieldByYear: [],
    sourceLabel: "—",
  };
}

export async function loadCryptoAssetDossier(symbolInput: string): Promise<AssetDossier | null> {
  const symbol = symbolInput.trim().toUpperCase();
  if (!/^[A-Z0-9.-]{1,16}$/.test(symbol)) return null;

  return rememberWithTtl(`crypto-dossier:${symbol}:v1`, 3 * 60_000, async () => {
    if (!(await canUseMarketProvider("coingecko"))) return null;

    const coinId = await resolveCoinGeckoId(symbol);
    if (!coinId) return null;

    const [detail, history, articles] = await Promise.all([
      fetchCoinGeckoDetail(coinId),
      fetchCoinGeckoHistory(coinId),
      loadCachedAggregatedNews(72).catch(() => [] as NewsArticle[]),
    ]);

    if (!detail) return null;
    await noteMarketProviderUsage("coingecko");

    const quote = mapCryptoQuote(detail, symbol);
    const cryptoProfile = buildCryptoProfile(detail, coinId, symbol);
    const companyName = detail.name ?? findCryptoAssetBySymbol(symbol)?.shortName ?? symbol;
    const summary =
      readLocalizedDescription(detail) ??
      `${companyName} é um ativo digital listado na mesa global de criptomoedas da PRONUXFIN, com histórico de preço, métricas on-chain de mercado e contexto de ecossistema via CoinGecko.`;
    const keywords = [
      symbol,
      companyName,
      ...cryptoProfile.categories,
      "crypto",
      "criptomoeda",
      "blockchain",
    ].filter((k) => k.length >= 2);
    const historicalInsights = computeAssetDossierHistoricalInsights(history);
    const periodStats = computeAssetDossierPeriodStats(
      history,
      quote.regularMarketPrice,
      cryptoProfile.athPrice,
      cryptoProfile.atlPrice,
    );
    const comparablePeers = listCryptoSectorPeers(symbol);
    const primaryCategory = cryptoProfile.categories[0] ?? null;

    return {
      symbol,
      assetClass: "crypto",
      deskMarket: null,
      region: "intl",
      historyMode: history.length > 1 ? "live" : "indicative",
      quote,
      companyName,
      currency: "BRL",
      foundedYear: cryptoProfile.genesisDate
        ? new Date(cryptoProfile.genesisDate).getUTCFullYear()
        : null,
      headquarters: null,
      country: null,
      exchange: "Mercado cripto global",
      website: cryptoProfile.homepageUrl,
      ipoDate: cryptoProfile.genesisDate,
      sector: primaryCategory,
      industry: cryptoProfile.cryptoSector,
      ceoName: null,
      fullTimeEmployees: null,
      intlStockPeers: null,
      comparablePeers,
      marketExtras: {
        beta: null,
        dividendYield: null,
        priceToBook: null,
        profitMargin: null,
        returnOnEquity: null,
        returnOnAssets: null,
        debtToEquity: null,
        payoutRatio: null,
        trailingAnnualDividendRate: null,
        bookValuePerShare: null,
        enterpriseValue: cryptoProfile.fullyDilutedValuation,
        forwardPe: null,
        pegRatio: null,
        sharesOutstanding: cryptoProfile.circulatingSupply,
        floatShares: cryptoProfile.totalSupply,
        ceoName: null,
        fullTimeEmployees: null,
        sourceLabel: "CoinGecko · mercado",
      },
      periodStats,
      dividends: emptyDividends(),
      summary,
      keywords,
      sourceLabel: "CoinGecko",
      marketCap: brl(detail, "market_cap"),
      regularMarketVolume: brl(detail, "total_volume"),
      regularMarketOpen: null,
      regularMarketPreviousClose: null,
      regularMarketDayHigh: brl(detail, "high_24h"),
      regularMarketDayLow: brl(detail, "low_24h"),
      fiftyTwoWeekHigh: cryptoProfile.athPrice,
      fiftyTwoWeekLow: cryptoProfile.atlPrice,
      priceEarnings: null,
      earningsPerShare: null,
      history: history.length > 1 ? history : [],
      bestMove: computeExtremeMove(history, "best"),
      worstMove: computeExtremeMove(history, "worst"),
      relatedNews: pickRelatedNews(articles, keywords),
      intlKeyMetricsTtm: null,
      intlAnnualStatements: null,
      historicalInsights,
      cryptoProfile,
    };
  });
}
