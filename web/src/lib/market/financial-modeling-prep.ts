import {
  canUseMarketProvider,
  noteMarketProviderUsage,
} from "@/lib/market/market-provider-budget";

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
  sourceLabel: string;
};

export async function fetchIntlCompanyProfileFromFmp(
  symbol: string,
): Promise<IntlCompanyProfile | null> {
  const toggle = process.env.MARKET_PROVIDER_FMP_ENABLED?.trim().toLowerCase();
  if (toggle === "0" || toggle === "false" || toggle === "no" || toggle === "off") {
    return null;
  }

  const apiKey =
    process.env.FMP_API_KEY?.trim() ||
    process.env.FINANCIAL_MODELING_PREP_API_KEY?.trim() ||
    "";
  if (!apiKey) return null;
  if (!canUseMarketProvider("financial_modeling_prep")) return null;

  try {
    const url = `https://financialmodelingprep.com/api/v3/profile/${encodeURIComponent(
      symbol,
    )}?apikey=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
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
  if (/^https?:\/\//i.test(text)) return text;
  return `https://${text}`;
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const time = Date.parse(trimmed);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}
