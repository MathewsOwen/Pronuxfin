import { NextResponse } from "next/server";
import { loadQuotesPayload } from "@/lib/market/load-quotes-payload";
import { rateLimitResponse } from "@/lib/security/rate-limit-http";

/** Sem cache de rota / CDN: cada GET consulta brapi + CoinGecko na hora. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
  res.headers.set(
    "Cache-Control",
    "private, no-store, max-age=0, must-revalidate",
  );
  return res;
}
