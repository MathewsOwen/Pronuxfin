/** Browser → BFF auth mutations (register/login). Render free tier cold start ≈ 50s. */
export const AUTH_CLIENT_TIMEOUT_MS = 60_000;

/** BFF → Nest auth upstream. Keep below Vercel Hobby maxDuration (10s) only on Hobby — Pro allows 60s. */
export const AUTH_UPSTREAM_TIMEOUT_RENDER_MS = 55_000;

export const DEFAULT_AUTH_UPSTREAM_TIMEOUT_MS = 12_000;

export function resolveAuthUpstreamTimeoutMs(apiUrl: string): number {
  const raw = Number(process.env.AUTH_UPSTREAM_TIMEOUT_MS);
  if (Number.isFinite(raw) && raw > 0) return raw;
  if (apiUrl.includes("onrender.com")) return AUTH_UPSTREAM_TIMEOUT_RENDER_MS;
  return DEFAULT_AUTH_UPSTREAM_TIMEOUT_MS;
}
