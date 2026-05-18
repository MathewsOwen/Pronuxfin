import { isFmpProviderEnabled } from "@/lib/market/fmp-config";

export type MarketProviderId =
  | "brapi"
  | "coingecko"
  | "yahoo"
  | "alpha_vantage"
  | "financial_modeling_prep"
  | "polygon"
  | "twelve_data"
  | "marketstack"
  | "finnhub"
  | "eod_historical_data"
  | "rss_public";

export type MarketDataTask =
  | "br_equities_snapshot"
  | "intl_equities_snapshot"
  | "crypto_snapshot"
  | "sector_book_br"
  | "sector_book_intl"
  | "crypto_sector_book"
  | "asset_profile_br"
  | "asset_profile_intl"
  | "asset_history_br"
  | "asset_history_intl"
  | "asset_related_news";

export type MarketProviderDescriptor = {
  id: MarketProviderId;
  label: string;
  enabledByDefault: boolean;
  envToggle?: string;
  softMonthlyLimitEnv?: string;
};

const PROVIDERS: Record<MarketProviderId, MarketProviderDescriptor> = {
  brapi: {
    id: "brapi",
    label: "BRAPI",
    enabledByDefault: true,
    softMonthlyLimitEnv: "MARKET_PROVIDER_BRAPI_SOFT_MONTHLY_LIMIT",
  },
  coingecko: {
    id: "coingecko",
    label: "CoinGecko",
    enabledByDefault: true,
    softMonthlyLimitEnv: "MARKET_PROVIDER_COINGECKO_SOFT_MONTHLY_LIMIT",
  },
  yahoo: {
    id: "yahoo",
    label: "Yahoo Finance",
    enabledByDefault: true,
    softMonthlyLimitEnv: "MARKET_PROVIDER_YAHOO_SOFT_MONTHLY_LIMIT",
  },
  alpha_vantage: {
    id: "alpha_vantage",
    label: "Alpha Vantage",
    enabledByDefault: false,
    envToggle: "MARKET_PROVIDER_ALPHA_VANTAGE_ENABLED",
    softMonthlyLimitEnv: "MARKET_PROVIDER_ALPHA_VANTAGE_SOFT_MONTHLY_LIMIT",
  },
  financial_modeling_prep: {
    id: "financial_modeling_prep",
    label: "Financial Modeling Prep",
    enabledByDefault: false,
    envToggle: "MARKET_PROVIDER_FMP_ENABLED",
    softMonthlyLimitEnv: "MARKET_PROVIDER_FMP_SOFT_MONTHLY_LIMIT",
  },
  polygon: {
    id: "polygon",
    label: "Polygon.io",
    enabledByDefault: false,
    envToggle: "MARKET_PROVIDER_POLYGON_ENABLED",
    softMonthlyLimitEnv: "MARKET_PROVIDER_POLYGON_SOFT_MONTHLY_LIMIT",
  },
  twelve_data: {
    id: "twelve_data",
    label: "Twelve Data",
    enabledByDefault: false,
    envToggle: "MARKET_PROVIDER_TWELVE_DATA_ENABLED",
    softMonthlyLimitEnv: "MARKET_PROVIDER_TWELVE_DATA_SOFT_MONTHLY_LIMIT",
  },
  marketstack: {
    id: "marketstack",
    label: "Marketstack",
    enabledByDefault: false,
    envToggle: "MARKET_PROVIDER_MARKETSTACK_ENABLED",
    softMonthlyLimitEnv: "MARKET_PROVIDER_MARKETSTACK_SOFT_MONTHLY_LIMIT",
  },
  finnhub: {
    id: "finnhub",
    label: "Finnhub",
    enabledByDefault: false,
    envToggle: "MARKET_PROVIDER_FINNHUB_ENABLED",
    softMonthlyLimitEnv: "MARKET_PROVIDER_FINNHUB_SOFT_MONTHLY_LIMIT",
  },
  eod_historical_data: {
    id: "eod_historical_data",
    label: "EOD Historical Data",
    enabledByDefault: false,
    envToggle: "MARKET_PROVIDER_EODHD_ENABLED",
    softMonthlyLimitEnv: "MARKET_PROVIDER_EODHD_SOFT_MONTHLY_LIMIT",
  },
  rss_public: {
    id: "rss_public",
    label: "Public RSS",
    enabledByDefault: true,
    softMonthlyLimitEnv: "MARKET_PROVIDER_RSS_SOFT_MONTHLY_LIMIT",
  },
};

const TASK_PRIORITIES: Record<MarketDataTask, MarketProviderId[]> = {
  br_equities_snapshot: ["brapi", "financial_modeling_prep", "alpha_vantage"],
  intl_equities_snapshot: ["yahoo", "finnhub", "marketstack", "alpha_vantage"],
  crypto_snapshot: ["coingecko"],
  sector_book_br: ["brapi", "financial_modeling_prep"],
  sector_book_intl: ["yahoo", "finnhub", "marketstack", "alpha_vantage"],
  crypto_sector_book: ["coingecko"],
  asset_profile_br: ["brapi", "financial_modeling_prep", "finnhub"],
  asset_profile_intl: [
    "financial_modeling_prep",
    "finnhub",
    "yahoo",
    "marketstack",
  ],
  asset_history_br: ["brapi", "alpha_vantage"],
  asset_history_intl: [
    "yahoo",
    "twelve_data",
    "eod_historical_data",
    "alpha_vantage",
  ],
  asset_related_news: ["rss_public", "finnhub"],
};

export function getMarketProvider(id: MarketProviderId): MarketProviderDescriptor {
  return PROVIDERS[id];
}

export function getMarketTaskProviders(task: MarketDataTask): MarketProviderId[] {
  return TASK_PRIORITIES[task].filter(isMarketProviderEnabled);
}

export function isMarketProviderEnabled(id: MarketProviderId): boolean {
  if (id === "financial_modeling_prep") {
    return isFmpProviderEnabled();
  }

  const provider = PROVIDERS[id];
  if (!provider.envToggle) return provider.enabledByDefault;

  const raw = process.env[provider.envToggle]?.trim().toLowerCase();
  if (!raw) return provider.enabledByDefault;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

export function getMarketProviderSoftMonthlyLimit(
  id: MarketProviderId,
): number | null {
  const envName = PROVIDERS[id].softMonthlyLimitEnv;
  if (!envName) return null;
  const raw = process.env[envName];
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
