import { fetchMarket } from "@/lib/http/fetch-with-timeout";
import { safeExternalUrl } from "@/lib/http/safe-external-url";
import { isFmpProviderEnabled } from "@/lib/market/fmp-config";
import {
  canUseMarketProvider,
  noteMarketProviderUsage,
} from "@/lib/market/market-provider-budget";
import type { IntlAnnualStatementsSnapshot, IntlKeyMetricsTtm } from "@/lib/market/types";

function fmpApiKey(): string {
  return (
    process.env.FMP_API_KEY?.trim() ||
    process.env.FINANCIAL_MODELING_PREP_API_KEY?.trim() ||
    ""
  );
}

function fmpReady(): boolean {
  return isFmpProviderEnabled() && canUseMarketProvider("financial_modeling_prep");
}

type FmpProfileRow = {
  companyName?: string;
  description?: string;
  sector?: string;
  industry?: string;
  country?: string;
  exchangeShortName?: string;
  exchange?: string;
  website?: string;
  image?: string;
  ipoDate?: string;
  city?: string;
  state?: string;
  ceo?: string;
  fullTimeEmployees?: number | string;
};

export type IntlCompanyProfile = {
  companyName: string | null;
  summary: string | null;
  sector: string | null;
  industry: string | null;
  headquarters: string | null;
  country: string | null;
  exchange: string | null;
  website: string | null;
  imageUrl: string | null;
  ipoDate: string | null;
  ceoName: string | null;
  fullTimeEmployees: number | null;
  sourceLabel: string;
};

export async function fetchIntlCompanyProfileFromFmp(
  symbol: string,
): Promise<IntlCompanyProfile | null> {
  if (!fmpReady()) return null;
  const apiKey = fmpApiKey();
  if (!apiKey) return null;

  try {
    const url = `https://financialmodelingprep.com/api/v3/profile/${encodeURIComponent(
      symbol,
    )}?apikey=${encodeURIComponent(apiKey)}`;
    const res = await fetchMarket(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "PRONUXFIN/1.0 (+https://pronuxfin.com.br; institutional asset dossiers)",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`fmp_status_${res.status}`);
    }

    const json = (await res.json()) as FmpProfileRow[] | { profile?: FmpProfileRow[] };
    const row = Array.isArray(json) ? json[0] : json.profile?.[0];
    if (!row) return null;

    noteMarketProviderUsage("financial_modeling_prep");
    return normalizeFmpProfile(row);
  } catch {
    return null;
  }
}

/** Pares setoriais (tickers) — não confundir com filiais ou grupo controlador. */
export async function fetchIntlStockPeersFromFmp(symbol: string): Promise<string[] | null> {
  if (!fmpReady()) return null;
  const apiKey = fmpApiKey();
  if (!apiKey) return null;

  try {
    const url = `https://financialmodelingprep.com/api/v4/stock_peers?symbol=${encodeURIComponent(
      symbol,
    )}&apikey=${encodeURIComponent(apiKey)}`;
    const res = await fetchMarket(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "PRONUXFIN/1.0 (+https://pronuxfin.com.br; institutional asset dossiers)",
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`fmp_peers_status_${res.status}`);

    const json = (await res.json()) as Array<{ symbol?: string; peersList?: string }>;
    const row = Array.isArray(json) ? json[0] : null;
    const raw = typeof row?.peersList === "string" ? row.peersList : "";
    if (!raw.trim()) return null;

    const upper = symbol.trim().toUpperCase();
    const peers = raw
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter((t) => t.length > 0 && t !== upper);

    if (!peers.length) return null;

    noteMarketProviderUsage("financial_modeling_prep");
    return peers.slice(0, 16);
  } catch {
    return null;
  }
}

function fmpReadNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export async function fetchIntlKeyMetricsTtmFromFmp(
  symbol: string,
): Promise<IntlKeyMetricsTtm | null> {
  if (!fmpReady()) return null;
  const apiKey = fmpApiKey();
  if (!apiKey) return null;

  try {
    const url = `https://financialmodelingprep.com/api/v3/key-metrics-ttm/${encodeURIComponent(
      symbol,
    )}?apikey=${encodeURIComponent(apiKey)}`;
    const res = await fetchMarket(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "PRONUXFIN/1.0 (+https://pronuxfin.com.br; institutional asset dossiers)",
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`fmp_key_metrics_status_${res.status}`);

    const json = (await res.json()) as Record<string, unknown>[];
    const row = Array.isArray(json) ? json[0] : null;
    if (!row || typeof row !== "object") return null;

    noteMarketProviderUsage("financial_modeling_prep");
    return {
      sourceLabel: "Financial Modeling Prep · key metrics TTM",
      dividendYield: fmpReadNumber(row.dividendYieldTTM),
      peRatio: fmpReadNumber(row.peRatioTTM),
      marketCap: fmpReadNumber(row.marketCapTTM),
      enterpriseValue: fmpReadNumber(row.enterpriseValueTTM),
      revenuePerShare: fmpReadNumber(row.revenuePerShareTTM),
      netIncomePerShare: fmpReadNumber(row.netIncomePerShareTTM),
      operatingCashFlowPerShare: fmpReadNumber(row.operatingCashFlowPerShareTTM),
      freeCashFlowPerShare: fmpReadNumber(row.freeCashFlowPerShareTTM),
      roe: fmpReadNumber(row.roeTTM),
      debtToEquity: fmpReadNumber(row.debtToEquityTTM),
      currentRatio: fmpReadNumber(row.currentRatioTTM),
    };
  } catch {
    return null;
  }
}

function normalizeFmpProfile(row: FmpProfileRow): IntlCompanyProfile {
  return {
    companyName: cleanText(row.companyName),
    summary: cleanText(row.description, 680),
    sector: cleanText(row.sector),
    industry: cleanText(row.industry),
    headquarters: joinLocation(row.city, row.state, row.country),
    country: cleanText(row.country),
    exchange: cleanText(row.exchangeShortName) ?? cleanText(row.exchange),
    website: normalizeWebsite(row.website),
    imageUrl: cleanText(row.image),
    ipoDate: normalizeDate(row.ipoDate),
    ceoName: cleanText(row.ceo),
    fullTimeEmployees: fmpReadNumber(row.fullTimeEmployees),
    sourceLabel: "FMP + Yahoo Finance + PRONUX model",
  };
}

function cleanText(value: unknown, maxLength = 220): string | null {
  if (typeof value !== "string") return null;
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return null;
  return compact.length > maxLength ? `${compact.slice(0, maxLength - 1)}…` : compact;
}

function joinLocation(...parts: Array<string | undefined>) {
  const normalized = parts
    .map((part) => cleanText(part))
    .filter((part): part is string => Boolean(part));
  return normalized.length ? normalized.join(", ") : null;
}

function normalizeWebsite(value: unknown) {
  const text = cleanText(value);
  if (!text) return null;
  return safeExternalUrl(text);
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const time = Date.parse(trimmed);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

type FmpAnnualRow = Record<string, unknown>;

async function fmpFetchAnnualRow(
  symbol: string,
  path: "income-statement" | "balance-sheet-statement" | "cash-flow-statement",
  apiKey: string,
): Promise<FmpAnnualRow | null> {
  const url = `https://financialmodelingprep.com/api/v3/${path}/${encodeURIComponent(
    symbol,
  )}?period=annual&limit=1&apikey=${encodeURIComponent(apiKey)}`;
  const res = await fetchMarket(url, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "PRONUXFIN/1.0 (+https://pronuxfin.com.br; institutional asset dossiers)",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as FmpAnnualRow[];
  const row = Array.isArray(json) ? json[0] : null;
  if (!row || typeof row !== "object") return null;
  noteMarketProviderUsage("financial_modeling_prep");
  return row;
}

export async function fetchStockDividendHistoryFromFmp(
  symbol: string,
): Promise<Array<Record<string, unknown>>> {
  if (!fmpReady()) return [];
  const apiKey = fmpApiKey();
  if (!apiKey) return [];

  try {
    const url = `https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${encodeURIComponent(
      symbol,
    )}?apikey=${encodeURIComponent(apiKey)}`;
    const res = await fetchMarket(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "PRONUXFIN/1.0 (+https://pronuxfin.com.br; institutional asset dossiers)",
      },
      cache: "no-store",
    });
    if (!res.ok) return [];

    const json = (await res.json()) as {
      historical?: Array<Record<string, unknown>>;
      symbol?: string;
    };
    const rows = Array.isArray(json.historical) ? json.historical : [];
    if (!rows.length) return [];

    noteMarketProviderUsage("financial_modeling_prep");
    return rows;
  } catch {
    return [];
  }
}

export async function fetchIntlLatestAnnualStatementsFromFmp(
  symbol: string,
): Promise<IntlAnnualStatementsSnapshot | null> {
  if (!fmpReady()) return null;
  const apiKey = fmpApiKey();
  if (!apiKey) return null;

  try {
    const [income, balance, cf] = await Promise.all([
      fmpFetchAnnualRow(symbol, "income-statement", apiKey),
      fmpFetchAnnualRow(symbol, "balance-sheet-statement", apiKey),
      fmpFetchAnnualRow(symbol, "cash-flow-statement", apiKey),
    ]);

    if (!income && !balance && !cf) return null;

    const yInc = fmpReadNumber(income?.calendarYear);
    const yBal = fmpReadNumber(balance?.calendarYear);
    const yCf = fmpReadNumber(cf?.calendarYear);
    const year = yInc ?? yBal ?? yCf;
    const periodLabel =
      year != null && Number.isFinite(year) ? `FY ${Math.round(year)}` : null;

    const reportedCurrency =
      (typeof income?.reportedCurrency === "string" && income.reportedCurrency) ||
      (typeof balance?.reportedCurrency === "string" && balance.reportedCurrency) ||
      (typeof cf?.reportedCurrency === "string" && cf.reportedCurrency) ||
      "USD";

    const out: IntlAnnualStatementsSnapshot = {
      sourceLabel: "Financial Modeling Prep · annual statements (latest)",
      periodLabel,
      reportedCurrency,
      revenue: fmpReadNumber(income?.revenue),
      grossProfit: fmpReadNumber(income?.grossProfit),
      operatingIncome: fmpReadNumber(income?.operatingIncome),
      netIncome: fmpReadNumber(income?.netIncome),
      totalAssets: fmpReadNumber(balance?.totalAssets),
      totalDebt: fmpReadNumber(balance?.totalDebt),
      totalEquity: fmpReadNumber(balance?.totalStockholdersEquity),
      cashAndEquivalents: fmpReadNumber(balance?.cashAndCashEquivalents),
      operatingCashFlow: fmpReadNumber(
        cf?.operatingCashFlow ?? cf?.netCashProvidedByOperatingActivities,
      ),
      capex: fmpReadNumber(cf?.capitalExpenditure),
      freeCashFlow: fmpReadNumber(cf?.freeCashFlow),
    };

    const hasNumeric = [
      out.revenue,
      out.grossProfit,
      out.operatingIncome,
      out.netIncome,
      out.totalAssets,
      out.totalDebt,
      out.totalEquity,
      out.cashAndEquivalents,
      out.operatingCashFlow,
      out.capex,
      out.freeCashFlow,
    ].some((v) => v != null && Number.isFinite(v));

    if (!hasNumeric) return null;
    return out;
  } catch {
    return null;
  }
}
