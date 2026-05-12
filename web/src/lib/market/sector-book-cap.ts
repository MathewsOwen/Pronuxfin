/**
 * Tamanho máximo por setor no livro (BR + exterior). Mais tickers ⇒ mais paralelismo na BRAPI/Yahoo —
 * mantenha `BRAPI_TOKEN` em produção.
 *
 * `NEXT_PUBLIC_PRONUX_SECTOR_BOOK_SIZE` — clamp 120…400 (default 280).
 */
const DEF = 280;
const MIN = 120;
const MAX_CAP = 400;

/**
 * Livro setorial de cripto usa CoinGecko simples por lotes; mantemos um cap separado para evitar
 * URLs excessivas e preservar latência saudável no plano público.
 *
 * `NEXT_PUBLIC_PRONUX_CRYPTO_SECTOR_BOOK_SIZE` — clamp 16…120 (default 60).
 */
const CRYPTO_DEF = 60;
const CRYPTO_MIN = 16;
const CRYPTO_MAX_CAP = 120;

function readPublicInt(name: string, fallback: number): number {
  if (typeof process === "undefined" || !process.env?.[name]) return fallback;
  const n = Number(process.env[name]);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

export function getSectorBookMaxTickers(): number {
  return Math.min(MAX_CAP, Math.max(MIN, readPublicInt("NEXT_PUBLIC_PRONUX_SECTOR_BOOK_SIZE", DEF)));
}

export function getCryptoSectorBookMaxTickers(): number {
  return Math.min(
    CRYPTO_MAX_CAP,
    Math.max(
      CRYPTO_MIN,
      readPublicInt("NEXT_PUBLIC_PRONUX_CRYPTO_SECTOR_BOOK_SIZE", CRYPTO_DEF),
    ),
  );
}
