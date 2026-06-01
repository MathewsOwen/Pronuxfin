import { INDEX_PROXY_TICKERS } from "@/lib/market/indices";
import {
  SECTOR_ORDER,
  listSectorSymbols,
  type SectorId,
} from "@/lib/market/sector-universe";

const LIVE_DESK_BR_DEF = 300;
const LIVE_DESK_BR_MIN = 58;
const LIVE_DESK_BR_MAX = 600;

const LIVE_DESK_INTL_DEF = 200;
const LIVE_DESK_INTL_MIN = 0;
const LIVE_DESK_INTL_MAX = 400;

export const LIVE_DESK_CRYPTO_DEF = 250;
const LIVE_DESK_CRYPTO_MIN = 12;
const LIVE_DESK_CRYPTO_MAX = 500;

function readServerInt(name: string, fallback: number): number {
  if (typeof process === "undefined" || !process.env?.[name]) return fallback;
  const n = Number(process.env[name]);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

function dedupeOrdered(symbols: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of symbols) {
    const symbol = raw.trim().toUpperCase();
    if (!symbol || seen.has(symbol)) continue;
    seen.add(symbol);
    out.push(symbol);
  }
  return out;
}

export function getLiveDeskBrMax(): number {
  return Math.min(
    LIVE_DESK_BR_MAX,
    Math.max(LIVE_DESK_BR_MIN, readServerInt("PRONUX_LIVE_DESK_BR_MAX", LIVE_DESK_BR_DEF)),
  );
}

export function getLiveDeskIntlMax(): number {
  return Math.min(
    LIVE_DESK_INTL_MAX,
    Math.max(LIVE_DESK_INTL_MIN, readServerInt("PRONUX_LIVE_DESK_INTL_MAX", LIVE_DESK_INTL_DEF)),
  );
}

export function getLiveDeskCryptoMax(): number {
  return Math.min(
    LIVE_DESK_CRYPTO_MAX,
    Math.max(
      LIVE_DESK_CRYPTO_MIN,
      readServerInt("PRONUX_LIVE_DESK_CRYPTO_MAX", LIVE_DESK_CRYPTO_DEF),
    ),
  );
}

/** Mesa ao vivo B3: proxies de índice + universo setorial BR (deduplicado). */
export function listLiveDeskBrTickers(): readonly string[] {
  const sectorSymbols = SECTOR_ORDER.flatMap((sector: SectorId) =>
    listSectorSymbols("br", sector),
  );
  return dedupeOrdered([...INDEX_PROXY_TICKERS, ...sectorSymbols]).slice(
    0,
    getLiveDeskBrMax(),
  );
}

/** Ações internacionais na mesa ao vivo (deduplicado por setor). */
export function listLiveDeskIntlTickers(): readonly string[] {
  const sectorSymbols = SECTOR_ORDER.flatMap((sector: SectorId) =>
    listSectorSymbols("intl", sector),
  );
  return dedupeOrdered(sectorSymbols).slice(0, getLiveDeskIntlMax());
}
