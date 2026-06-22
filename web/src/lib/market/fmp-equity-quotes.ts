import { fetchMarket } from "@/lib/http/fetch-with-timeout";
import { isFmpProviderEnabled } from "@/lib/market/fmp-config";
import {
  canUseMarketProvider,
  noteMarketProviderUsage,
} from "@/lib/market/market-provider-budget";
import { sortQuotesByCanonicalOrder } from "@/lib/market/quote-order";
import type { QuoteSnapshot } from "@/lib/market/types";

const FMP_CHUNK = 40;

function fmpApiKey(): string {
  return (
    process.env.FMP_API_KEY?.trim() ||
    process.env.FINANCIAL_MODELING_PREP_API_KEY?.trim() ||
    ""
  );
}

function chunk<T>(arr: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function readOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapFmpRow(row: Record<string, unknown>): QuoteSnapshot | null {
  const symbol = String(row.symbol ?? "").trim().toUpperCase();
  if (!symbol) return null;
  return {
    symbol,
    shortName: typeof row.name === "string" ? row.name : undefined,
    currency: "USD",
    regularMarketPrice: readOptionalNumber(row.price),
    regularMarketChange: readOptionalNumber(row.change),
    regularMarketChangePercent: readOptionalNumber(row.changesPercentage),
    regularMarketVolume: readOptionalNumber(row.volume),
    segment: "equity",
  };
}

async function fetchFmpChunk(symbols: readonly string[]): Promise<QuoteSnapshot[]> {
  const apiKey = fmpApiKey();
  if (!apiKey || symbols.length === 0) return [];

  const qs = symbols.map((s) => encodeURIComponent(s)).join(",");
  const url = `https://financialmodelingprep.com/api/v3/quote/${qs}?apikey=${encodeURIComponent(apiKey)}`;
  const res = await fetchMarket(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "PRONUXFIN/1.0 (+https://pronuxfin.com.br; cotações FMP)",
    },
    cache: "no-store",
  });
  if (!res.ok) return [];

  const json = (await res.json()) as Array<Record<string, unknown>>;
  if (!Array.isArray(json)) return [];
  return json.map(mapFmpRow).filter((r): r is QuoteSnapshot => r != null);
}

/** Fallback licenciado quando Yahoo spark falha (requer FMP_API_KEY). */
export async function fetchFmpQuotesForSymbols(
  symbolsInput: readonly string[],
  sortOrderHint?: readonly string[],
): Promise<{
  rows: QuoteSnapshot[];
  simulated: boolean;
  partial: boolean;
  warning?: string;
}> {
  const uniq = [...new Set(symbolsInput.map((s) => s.trim().toUpperCase()))].filter(Boolean);
  const canonical = sortOrderHint ?? uniq;
  if (uniq.length === 0) {
    return { rows: [], simulated: false, partial: false };
  }
  if (!isFmpProviderEnabled() || !(await canUseMarketProvider("financial_modeling_prep"))) {
    return { rows: [], simulated: false, partial: true, warning: "intl_fmp_unavailable" };
  }

  const merged = new Map<string, QuoteSnapshot>();
  try {
    const chunks = chunk(uniq, FMP_CHUNK);
    const settled = await Promise.allSettled(chunks.map((syms) => fetchFmpChunk(syms)));
    for (const s of settled) {
      if (s.status === "fulfilled") {
        for (const row of s.value) merged.set(row.symbol, row);
      }
    }
    if (merged.size > 0) {
      await noteMarketProviderUsage("financial_modeling_prep");
    }
  } catch {
    return { rows: [], simulated: false, partial: true, warning: "intl_fmp_network" };
  }

  const sorted = sortQuotesByCanonicalOrder([...merged.values()], canonical);
  if (sorted.length === 0) {
    return { rows: [], simulated: false, partial: true, warning: "intl_fmp_empty" };
  }

  const partial = sorted.length < uniq.length;
  return {
    rows: sorted,
    simulated: false,
    partial,
    ...(partial ? { warning: "intl_partial" as const } : {}),
  };
}
