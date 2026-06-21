import type { EquityMarketRegion, QuoteSnapshot, SectorBookPayload } from "@/lib/market/types";

const SECTOR_BOOK_CACHE_PREFIX = "pronux:sector-book:v1:";
const SECTOR_BOOK_CACHE_TTL_MS = 5 * 60_000;

export function buildSkeletonQuoteRows(
  symbols: readonly string[],
  opts?: { segment?: QuoteSnapshot["segment"] },
): QuoteSnapshot[] {
  return symbols.map((symbol) => ({
    symbol,
    regularMarketPrice: null,
    regularMarketChange: null,
    regularMarketChangePercent: null,
    segment: opts?.segment ?? "equity",
  }));
}

function sectorBookCacheKey(region: EquityMarketRegion, sector: string): string {
  return `${SECTOR_BOOK_CACHE_PREFIX}${region}:${sector}`;
}

function sectorBookHasLivePrices(payload: SectorBookPayload): boolean {
  return payload.results.some((row) => row.regularMarketPrice != null);
}

/** Restaura último book válido da sessão (stale-while-revalidate). */
export function readCachedSectorBook(
  region: EquityMarketRegion,
  sector: string,
): SectorBookPayload | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(sectorBookCacheKey(region, sector));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt: number; payload: SectorBookPayload };
    if (Date.now() - parsed.savedAt > SECTOR_BOOK_CACHE_TTL_MS) return null;
    if (parsed.payload.fetchedAt <= 0 || !sectorBookHasLivePrices(parsed.payload)) return null;
    return parsed.payload;
  } catch {
    return null;
  }
}

export function writeCachedSectorBook(
  region: EquityMarketRegion,
  sector: string,
  payload: SectorBookPayload,
): void {
  if (typeof sessionStorage === "undefined") return;
  if (payload.fetchedAt <= 0 || !sectorBookHasLivePrices(payload)) return;
  try {
    sessionStorage.setItem(
      sectorBookCacheKey(region, sector),
      JSON.stringify({ savedAt: Date.now(), payload }),
    );
  } catch {
    /* quota / private mode */
  }
}

function degradedSectorBook(
  region: EquityMarketRegion,
  sector: string,
  symbols: readonly string[],
): SectorBookPayload {
  return {
    fetchedAt: Date.now(),
    region,
    sector,
    universeCount: symbols.length,
    source: region === "br" ? "brapi" : "yahoo",
    results: buildSkeletonQuoteRows(symbols),
    simulated: false,
    partial: true,
  };
}

/** Primeira pintura: tickers visíveis imediatamente; preços preenchem quando a API responder. */
export function sectorDeskPlaceholderPayload(
  region: EquityMarketRegion,
  sector: string,
  symbols: readonly string[],
): SectorBookPayload {
  return {
    fetchedAt: 0,
    region,
    sector,
    universeCount: symbols.length,
    source: region === "br" ? "brapi" : "yahoo",
    results: buildSkeletonQuoteRows(symbols),
    simulated: false,
    partial: true,
  };
}

export function sectorDeskFallbackPayload(
  region: EquityMarketRegion,
  sector: string,
  symbols: readonly string[],
): SectorBookPayload {
  return degradedSectorBook(region, sector, symbols);
}

export function sectorBookIsLoading(payload: SectorBookPayload): boolean {
  return payload.fetchedAt === 0;
}
