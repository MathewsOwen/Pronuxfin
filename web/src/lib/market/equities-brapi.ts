import { fetchMarket } from "@/lib/http/fetch-with-timeout";
import { QUOTE_TICKERS, sortQuotesForDesk } from "@/lib/market/indices";
import { listLiveDeskBrTickers } from "@/lib/market/live-desk-universe";
import { sortQuotesByCanonicalOrder } from "@/lib/market/quote-order";
import type { QuoteSnapshot } from "@/lib/market/types";

/** Sem token, a BRAPI limita quantidade de símbolos por GET — empacotamos várias chamadas. */
const BRAPI_FREE_MAX_SYMBOLS = 3;
const BRAPI_TOKEN_MAX_SYMBOLS_DEFAULT = 3;
const BRAPI_SEQUENTIAL_GAP_MS = 40;
const BRAPI_RETRY_AFTER_MS = 400;

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
  return process.env.BRAPI_TOKEN?.trim() ? 4 : 12;
}

function readBrapiSequentialParallel(): number {
  const raw = Number(process.env.BRAPI_SEQUENTIAL_PARALLEL);
  if (Number.isFinite(raw) && raw >= 1) {
    return Math.min(6, Math.floor(raw));
  }
  return Math.min(2, readBrapiParallelRequests());
}

/** Plano Starter: 1 símbolo/request evita 400/429 em lote; ondas paralelas mantêm latência <60s. */
function useBrapiSequentialMode(token: string | undefined): boolean {
  if (!token) return false;
  const batch = process.env.BRAPI_BATCH_MODE?.trim().toLowerCase();
  if (batch === "1" || batch === "true" || batch === "on") return false;
  return true;
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
  retried = false,
): Promise<QuoteSnapshot[]> {
  if (symbols.length === 0) return [];
  const qs = symbols.join(",");
  const url = token
    ? `https://brapi.dev/api/quote/${qs}?token=${encodeURIComponent(token)}`
    : `https://brapi.dev/api/quote/${qs}`;

  const res = await fetchMarket(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (res.status === 429 && !retried) {
    await new Promise((r) => setTimeout(r, BRAPI_RETRY_AFTER_MS));
    return fetchBrapiChunk(symbols, token, true);
  }

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

async function fetchBrapiChunkResilient(
  symbols: string[],
  token: string | undefined,
): Promise<QuoteSnapshot[]> {
  if (symbols.length === 0) return [];
  const rows = await fetchBrapiChunk(symbols, token);
  if (rows.length > 0) return rows;
  if (symbols.length === 1) return [];
  const mid = Math.ceil(symbols.length / 2);
  const [left, right] = await Promise.all([
    fetchBrapiChunkResilient(symbols.slice(0, mid), token),
    fetchBrapiChunkResilient(symbols.slice(mid), token),
  ]);
  return [...left, ...right];
}

async function fetchBrapiSequential(
  symbols: readonly string[],
  token: string | undefined,
): Promise<Map<string, QuoteSnapshot>> {
  const merged = new Map<string, QuoteSnapshot>();
  const parallel = readBrapiSequentialParallel();
  for (let i = 0; i < symbols.length; i += parallel) {
    const wave = symbols.slice(i, i + parallel);
    const settled = await Promise.allSettled(
      wave.map((sym) => fetchBrapiChunk([sym], token)),
    );
    for (let w = 0; w < wave.length; w++) {
      const sym = wave[w]!;
      const s = settled[w];
      if (s?.status === "fulfilled") {
        for (const r of s.value) merged.set(r.symbol, r);
      }
      if (!merged.has(sym)) {
        for (let attempt = 0; attempt < 2 && !merged.has(sym); attempt++) {
          await new Promise((r) => setTimeout(r, BRAPI_RETRY_AFTER_MS));
          const rows = await fetchBrapiChunk([sym], token);
          for (const r of rows) merged.set(r.symbol, r);
        }
      }
    }
    if (i + parallel < symbols.length) {
      await new Promise((r) => setTimeout(r, BRAPI_SEQUENTIAL_GAP_MS));
    }
  }

  const missing = symbols.filter((s) => !merged.has(s));
  for (const sym of missing) {
    for (let attempt = 0; attempt < 3 && !merged.has(sym); attempt++) {
      const rows = await fetchBrapiChunk([sym], token);
      for (const r of rows) merged.set(r.symbol, r);
      if (!merged.has(sym)) {
        await new Promise((r) => setTimeout(r, BRAPI_RETRY_AFTER_MS));
      }
    }
    await new Promise((r) => setTimeout(r, BRAPI_SEQUENTIAL_GAP_MS));
  }
  return merged;
}

export type BrapiBookResult = {
  rows: QuoteSnapshot[];
  simulated: boolean;
  partial: boolean;
  warning?: string;
};

function buildBrapiBookResult(
  merged: Map<string, QuoteSnapshot>,
  symbolsUpper: readonly string[],
  canonical: readonly string[],
): BrapiBookResult {
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

/** Agrega cotações BRAPI para um conjunto arbitrário de tickers B3/BDR BR. */
export async function fetchBrapiQuotesForSymbols(
  symbolsInput: readonly string[],
  opts?: { sortOrder?: readonly string[] },
): Promise<BrapiBookResult> {
  const symbolsUpper = [...new Set(symbolsInput.map((s) => s.trim().toUpperCase()))].filter(Boolean);
  const canonical = opts?.sortOrder ?? symbolsUpper;
  const token = process.env.BRAPI_TOKEN?.trim() || undefined;

  if (symbolsUpper.length === 0) {
    return { rows: [], simulated: false, partial: false };
  }

  if (token && useBrapiSequentialMode(token)) {
    try {
      const merged = await fetchBrapiSequential(symbolsUpper, token);
      return buildBrapiBookResult(merged, symbolsUpper, canonical);
    } catch {
      return {
        rows: [],
        simulated: false,
        partial: true,
        warning: "equities_network",
      };
    }
  }

  const chunkSize = token ? readBrapiMaxSymbolsPerRequest() : BRAPI_FREE_MAX_SYMBOLS;
  const chunks = chunk(symbolsUpper, chunkSize);
  const merged = new Map<string, QuoteSnapshot>();

  try {
    const parallelWaves = readBrapiParallelRequests();
    const interWaveMs = token ? 25 : 40;
    for (let i = 0; i < chunks.length; i += parallelWaves) {
      const wave = chunks.slice(i, i + parallelWaves);
      const settled = await Promise.allSettled(
        wave.map((syms) => fetchBrapiChunkResilient(syms, token)),
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

    const missing = symbolsUpper.filter((s) => !merged.has(s));
    for (const sym of missing) {
      const rows = await fetchBrapiChunk([sym], token);
      for (const r of rows) merged.set(r.symbol, r);
      await new Promise((r) => setTimeout(r, BRAPI_SEQUENTIAL_GAP_MS));
    }
  } catch {
    return {
      rows: [],
      simulated: false,
      partial: true,
      warning: "equities_network",
    };
  }

  return buildBrapiBookResult(merged, symbolsUpper, canonical);
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
 * Com token: modo sequencial (1 símbolo/request) — confiável no plano Starter.
 */
export async function fetchEquitiesFromBrapi(): Promise<BrapiBookResult> {
  const tickers = listLiveDeskBrTickers();
  const book = await fetchBrapiInWaves(tickers, tickers);
  return {
    ...book,
    rows: sortQuotesForDesk(book.rows),
  };
}
