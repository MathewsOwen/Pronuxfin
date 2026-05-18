import { QUOTE_TICKERS, sortQuotesForDesk } from "@/lib/market/indices";
import { sortQuotesByCanonicalOrder } from "@/lib/market/quote-order";
import type { QuoteSnapshot } from "@/lib/market/types";
import { shouldUseSimulatedMarketData } from "@/lib/market/market-data-policy";
import { simulatedB3EquitiesForSymbols } from "@/lib/market/equities-sim";

/** Sem token, a BRAPI limita quantidade de símbolos por GET — empacotamos várias chamadas. */
const BRAPI_FREE_MAX_SYMBOLS = 3;
const BRAPI_TOKEN_MAX_SYMBOLS = 24;

function chunk<T>(arr: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export function simulatedEquities(): QuoteSnapshot[] {
  return simulatedB3EquitiesForSymbols(QUOTE_TICKERS);
}

function mapBrapiRow(row: Record<string, unknown>): QuoteSnapshot {
  return {
    symbol: String(row.symbol ?? ""),
    shortName: typeof row.shortName === "string" ? row.shortName : undefined,
    currency: typeof row.currency === "string" ? row.currency : "BRL",
    regularMarketPrice:
      typeof row.regularMarketPrice === "number"
        ? row.regularMarketPrice
        : row.regularMarketPrice != null
          ? Number(row.regularMarketPrice)
          : null,
    regularMarketChange:
      typeof row.regularMarketChange === "number"
        ? row.regularMarketChange
        : row.regularMarketChange != null
          ? Number(row.regularMarketChange)
          : null,
    regularMarketChangePercent:
      typeof row.regularMarketChangePercent === "number"
        ? row.regularMarketChangePercent
        : row.regularMarketChangePercent != null
          ? Number(row.regularMarketChangePercent)
          : null,
    marketTime:
      typeof row.regularMarketTime === "string"
        ? row.regularMarketTime
        : undefined,
    segment: "equity",
  };
}

async function fetchBrapiChunk(
  symbols: string[],
  token: string | undefined,
): Promise<QuoteSnapshot[]> {
  if (symbols.length === 0) return [];
  const qs = symbols.join(",");
  const url = token
    ? `https://brapi.dev/api/quote/${qs}?token=${encodeURIComponent(token)}`
    : `https://brapi.dev/api/quote/${qs}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) return [];

  const json = (await res.json()) as {
    results?: Array<Record<string, unknown>>;
    error?: boolean;
  };

  if (json.error) return [];

  const raw = json.results ?? [];
  return raw
    .map(mapBrapiRow)
    .filter((r) => r.symbol.length > 0);
}

export type BrapiBookResult = {
  rows: QuoteSnapshot[];
  simulated: boolean;
  partial: boolean;
  warning?: string;
};

/** Agrega cotações BRAPI para um conjunto arbitrário de tickers B3/BDR BR. */
export async function fetchBrapiQuotesForSymbols(
  symbolsInput: readonly string[],
  opts?: { sortOrder?: readonly string[] },
): Promise<BrapiBookResult> {
  const symbolsUpper = [...new Set(symbolsInput.map((s) => s.trim().toUpperCase()))].filter(Boolean);
  const canonical = opts?.sortOrder ?? symbolsUpper;
  const token = process.env.BRAPI_TOKEN?.trim() || undefined;
  const chunkSize = token ? BRAPI_TOKEN_MAX_SYMBOLS : BRAPI_FREE_MAX_SYMBOLS;
  const chunks = chunk([...symbolsUpper], chunkSize);
  const merged = new Map<string, QuoteSnapshot>();

  try {
    if (token) {
      const settled = await Promise.allSettled(
        chunks.map((syms) => fetchBrapiChunk(syms, token)),
      );
      for (const s of settled) {
        if (s.status === "fulfilled") {
          for (const r of s.value) merged.set(r.symbol, r);
        }
      }
    } else {
      const parallelWaves = 6;
      const interWaveMs = 200;
      for (let i = 0; i < chunks.length; i += parallelWaves) {
        const wave = chunks.slice(i, i + parallelWaves);
        const settled = await Promise.allSettled(
          wave.map((syms) => fetchBrapiChunk(syms, undefined)),
        );
        for (const s of settled) {
          if (s.status === "fulfilled") {
            for (const r of s.value) merged.set(r.symbol, r);
          }
        }
        if (i + parallelWaves < chunks.length && chunks.length > 1) {
          await new Promise((r) => setTimeout(r, interWaveMs));
        }
      }
    }
  } catch {
    if (!shouldUseSimulatedMarketData()) {
      return {
        rows: [],
        simulated: false,
        partial: true,
        warning: "equities_network",
      };
    }
    return {
      rows: sortQuotesByCanonicalOrder(
        simulatedB3EquitiesForSymbols(canonical),
        canonical,
      ),
      simulated: true,
      partial: false,
      warning: "equities_network",
    };
  }

  const sorted = sortQuotesByCanonicalOrder([...merged.values()], canonical);

  if (sorted.length === 0) {
    if (!shouldUseSimulatedMarketData()) {
      return {
        rows: [],
        simulated: false,
        partial: true,
        warning: "equities_empty",
      };
    }
    return {
      rows: sortQuotesByCanonicalOrder(
        simulatedB3EquitiesForSymbols(canonical),
        canonical,
      ),
      simulated: true,
      partial: false,
      warning: "equities_empty",
    };
  }

  const partial = sorted.length < symbolsUpper.length;
  return {
    rows: sorted,
    simulated: false,
    partial,
    ...(partial ? { warning: "equities_partial" as const } : {}),
  };
}

/**
 * Livro institucional padrão (proxies + blue chips) — `/api/quotes` e ticker strip.
 */
export async function fetchEquitiesFromBrapi(): Promise<BrapiBookResult> {
  const book = await fetchBrapiQuotesForSymbols([...QUOTE_TICKERS], {
    sortOrder: QUOTE_TICKERS,
  });
  return {
    ...book,
    rows: sortQuotesForDesk(book.rows),
  };
}
