import { fetchMarket } from "@/lib/http/fetch-with-timeout";
import { QUOTE_TICKERS, sortQuotesForDesk } from "@/lib/market/indices";
import { listLiveDeskBrTickers } from "@/lib/market/live-desk-universe";
import { sortQuotesByCanonicalOrder } from "@/lib/market/quote-order";
import type { QuoteSnapshot } from "@/lib/market/types";

/** Sem token, a BRAPI limita quantidade de símbolos por GET — empacotamos várias chamadas. */
const BRAPI_FREE_MAX_SYMBOLS = 3;
const BRAPI_TOKEN_MAX_SYMBOLS_DEFAULT = 1;

function readBrapiMaxSymbolsPerRequest(): number {
  const raw = Number(process.env.BRAPI_MAX_SYMBOLS_PER_REQUEST);
  if (Number.isFinite(raw) && raw >= 1) {
    return Math.min(24, Math.floor(raw));
  }
  return BRAPI_TOKEN_MAX_SYMBOLS_DEFAULT;
}

function readBrapiParallelRequests(): number {
  const raw = Number(process.env.BRAPI_PARALLEL_REQUESTS);
  if (Number.isFinite(raw) && raw >= 1) {
    return Math.min(12, Math.floor(raw));
  }
  return process.env.BRAPI_TOKEN?.trim() ? 3 : 12;
}

function chunk<T>(arr: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export function simulatedEquities(): QuoteSnapshot[] {
  return [];
}

function readOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapBrapiRow(row: Record<string, unknown>): QuoteSnapshot {
  const logo =
    typeof row.logourl === "string"
      ? row.logourl
      : typeof row.logoUrl === "string"
        ? row.logoUrl
        : undefined;
  return {
    symbol: String(row.symbol ?? ""),
    shortName: typeof row.shortName === "string" ? row.shortName : undefined,
    currency: typeof row.currency === "string" ? row.currency : "BRL",
    regularMarketPrice: readOptionalNumber(row.regularMarketPrice),
    regularMarketChange: readOptionalNumber(row.regularMarketChange),
    regularMarketChangePercent: readOptionalNumber(row.regularMarketChangePercent),
    regularMarketVolume: readOptionalNumber(row.regularMarketVolume),
    imageUrl: logo,
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
  // Cotações em lote: sem modules (dossiê pede modules numa rota dedicada).
  const url = token
    ? `https://brapi.dev/api/quote/${qs}?token=${encodeURIComponent(token)}`
    : `https://brapi.dev/api/quote/${qs}`;

  const res = await fetchMarket(url, {
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
  const chunkSize = token ? readBrapiMaxSymbolsPerRequest() : BRAPI_FREE_MAX_SYMBOLS;
  const chunks = chunk([...symbolsUpper], chunkSize);
  const merged = new Map<string, QuoteSnapshot>();

  try {
    const parallelWaves = readBrapiParallelRequests();
    const interWaveMs = token ? 150 : 80;
    for (let i = 0; i < chunks.length; i += parallelWaves) {
      const wave = chunks.slice(i, i + parallelWaves);
      const settled = await Promise.allSettled(
        wave.map((syms) => fetchBrapiChunk(syms, token)),
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
  } catch {
    return {
      rows: [],
      simulated: false,
      partial: true,
      warning: "equities_network",
    };
  }

  const sorted = sortQuotesByCanonicalOrder([...merged.values()], canonical);

  if (sorted.length === 0) {
    return {
      rows: [],
      simulated: false,
      partial: true,
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

async function fetchBrapiInWaves(
  symbols: readonly string[],
  sortOrder: readonly string[],
): Promise<BrapiBookResult> {
  const token = process.env.BRAPI_TOKEN?.trim() || undefined;
  if (token) {
    return fetchBrapiQuotesForSymbols(symbols, { sortOrder });
  }

  const priority = [...QUOTE_TICKERS];
  const extended = symbols.filter((s) => !priority.includes(s as (typeof QUOTE_TICKERS)[number]));
  const priorityBook = await fetchBrapiQuotesForSymbols(priority, { sortOrder: priority });
  if (extended.length === 0) return priorityBook;

  const extendedBook = await fetchBrapiQuotesForSymbols(extended, { sortOrder });
  const merged = new Map<string, QuoteSnapshot>();
  for (const row of [...priorityBook.rows, ...extendedBook.rows]) {
    merged.set(row.symbol, row);
  }
  const rows = sortQuotesByCanonicalOrder([...merged.values()], sortOrder);
  const partial =
    priorityBook.partial ||
    extendedBook.partial ||
    rows.length < symbols.length;
  const warning = partial
    ? priorityBook.warning ?? extendedBook.warning ?? "equities_partial"
    : undefined;
  return {
    rows,
    simulated: false,
    partial,
    ...(warning ? { warning } : {}),
  };
}

/**
 * Livro institucional padrão (proxies + blue chips) — `/api/quotes` e ticker strip.
 * Sem token BRAPI: blue chips primeiro (ticker visível rápido), depois universo estendido.
 */
export async function fetchEquitiesFromBrapi(): Promise<BrapiBookResult> {
  const tickers = listLiveDeskBrTickers();
  const book = await fetchBrapiInWaves(tickers, tickers);
  return {
    ...book,
    rows: sortQuotesForDesk(book.rows),
  };
}
