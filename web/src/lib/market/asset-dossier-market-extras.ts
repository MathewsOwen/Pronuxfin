import type { AssetDossierMarketExtras } from "@/lib/market/types";

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function nested(row: Record<string, unknown>, key: string): Record<string, unknown> | null {
  const v = row[key];
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function pick(...values: unknown[]): number | null {
  for (const v of values) {
    const n = readNumber(v);
    if (n != null) return n;
  }
  return null;
}

/** Extrai ratios e dividendos de payloads BRAPI / Yahoo quando disponíveis. */
export function extractMarketExtrasFromQuoteRow(
  row: Record<string, unknown>,
): AssetDossierMarketExtras {
  const stats = nested(row, "defaultKeyStatistics");
  const financial = nested(row, "financialData");
  const summary = nested(row, "summaryProfile");

  return {
    beta: pick(row.beta, stats?.beta, financial?.beta),
    dividendYield: pick(row.dividendYield, stats?.dividendYield, financial?.dividendYield),
    priceToBook: pick(row.priceToBook, stats?.priceToBook, financial?.priceToBook),
    profitMargin: pick(row.profitMargins, stats?.profitMargins, financial?.profitMargins),
    returnOnEquity: pick(row.returnOnEquity, stats?.returnOnEquity, financial?.returnOnEquity),
    returnOnAssets: pick(row.returnOnAssets, stats?.returnOnAssets, financial?.returnOnAssets),
    debtToEquity: pick(row.debtToEquity, stats?.debtToEquity, financial?.debtToEquity),
    payoutRatio: pick(row.payoutRatio, stats?.payoutRatio, financial?.payoutRatio),
    trailingAnnualDividendRate: pick(
      row.trailingAnnualDividendRate,
      stats?.trailingAnnualDividendRate,
      financial?.dividendRate,
    ),
    bookValuePerShare: pick(row.bookValue, stats?.bookValue, financial?.bookValue),
    enterpriseValue: pick(row.enterpriseValue, stats?.enterpriseValue),
    forwardPe: pick(row.forwardPE, stats?.forwardPE, financial?.forwardPE),
    pegRatio: pick(row.pegRatio, stats?.pegRatio),
    sharesOutstanding: pick(row.sharesOutstanding, stats?.sharesOutstanding),
    floatShares: pick(row.floatShares, stats?.floatShares),
    ceoName: typeof summary?.ceo === "string" ? summary.ceo.trim() || null : null,
    fullTimeEmployees: readNumber(summary?.fullTimeEmployees),
    sourceLabel: "Cotação detalhada",
  };
}

export function mergeMarketExtras(
  primary: AssetDossierMarketExtras,
  fallback: AssetDossierMarketExtras | null,
): AssetDossierMarketExtras {
  if (!fallback) return primary;
  const keys = Object.keys(primary) as (keyof AssetDossierMarketExtras)[];
  const out = { ...primary };
  for (const key of keys) {
    if (key === "sourceLabel") continue;
    const v = out[key];
    const fb = fallback[key];
    if ((v == null || (typeof v === "number" && !Number.isFinite(v))) && fb != null) {
      (out as Record<string, unknown>)[key] = fb;
    }
  }
  return out;
}

export function marketExtrasHasDisplayData(extras: AssetDossierMarketExtras): boolean {
  const nums = [
    extras.beta,
    extras.dividendYield,
    extras.priceToBook,
    extras.profitMargin,
    extras.returnOnEquity,
    extras.returnOnAssets,
    extras.debtToEquity,
    extras.payoutRatio,
    extras.trailingAnnualDividendRate,
    extras.bookValuePerShare,
    extras.enterpriseValue,
    extras.forwardPe,
    extras.pegRatio,
    extras.sharesOutstanding,
    extras.floatShares,
  ];
  return nums.some((v) => v != null && Number.isFinite(v));
}
