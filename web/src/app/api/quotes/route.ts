import { NextResponse } from "next/server";
import { loadQuotesPayload } from "@/lib/market/load-quotes-payload";
import { applyMarketApiCacheHeaders } from "@/lib/http/market-api-cache";
import { rateLimitResponse } from "@/lib/security/rate-limit-http";

/** Cache CDN 12s + TTL in-memory no gateway; BRAPI em ondas paralelas. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** Mesa ao vivo com centenas de tickers BR (várias ondas BRAPI). */
export const maxDuration = 60;

const QUOTES_WINDOW_MS = 60_000;
const QUOTES_MAX_PER_WINDOW = 72;

export async function GET() {
  const limited = await rateLimitResponse(
    "quotes",
    QUOTES_MAX_PER_WINDOW,
    QUOTES_WINDOW_MS,
    { failClosed: false },
  );
  if (limited) return limited;

  const { payload, warnings } = await loadQuotesPayload();

  const res = NextResponse.json(
    warnings.length ? { ...payload, warnings } : payload,
  );
  applyMarketApiCacheHeaders(res);
  return res;
}
