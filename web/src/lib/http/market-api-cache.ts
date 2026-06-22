/** Cache curto na CDN Vercel — dados já têm TTL in-memory no gateway. */
export const MARKET_API_CACHE_CONTROL =
  "public, s-maxage=12, stale-while-revalidate=45";

export function applyMarketApiCacheHeaders(res: Response): void {
  res.headers.set("Cache-Control", MARKET_API_CACHE_CONTROL);
}
