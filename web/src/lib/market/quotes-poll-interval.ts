/** Janela mínima de atualização ao vivo nas mesas públicas (API + narrativa institucional). */
export const MIN_PUBLIC_QUOTES_POLL_MS = 15_000;

const MAX_PUBLIC_QUOTES_POLL_MS = 600_000;

function readMs(envKey: string, fallback: number): number {
  if (typeof process === "undefined" || !process.env?.[envKey]) return fallback;
  const n = Number(process.env[envKey]);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

/**
 * Ciclo cliente para `/api/quotes` (tape institucional, proxies, blue chips).
 * `NEXT_PUBLIC_QUOTES_POLL_MS` — default 15000, mínimo 15000 ms.
 */
export const PUBLIC_DESK_QUOTES_POLL_MS = Math.min(
  MAX_PUBLIC_QUOTES_POLL_MS,
  Math.max(MIN_PUBLIC_QUOTES_POLL_MS, readMs("NEXT_PUBLIC_QUOTES_POLL_MS", MIN_PUBLIC_QUOTES_POLL_MS)),
);
