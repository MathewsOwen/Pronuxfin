import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { loadAuthMarketLogos } from "@/lib/market/load-auth-market-logos";
import { rateLimitResponse } from "@/lib/security/rate-limit-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOGO_WINDOW_MS = 60_000;
const LOGO_MAX_PER_IP = 30;

const getCachedAuthMarketLogos = unstable_cache(
  loadAuthMarketLogos,
  ["auth-market-logos-v1"],
  { revalidate: 3600 },
);

/** Logos reais (BRAPI / CoinGecko / FMP) para o cenário de auth. */
export async function GET(req: Request) {
  const limited = await rateLimitResponse(
    "auth-market-logos",
    LOGO_MAX_PER_IP,
    LOGO_WINDOW_MS,
    { failClosed: false, req },
  );
  if (limited) return limited;

  try {
    const logos = await getCachedAuthMarketLogos();
    return NextResponse.json(
      { logos },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      },
    );
  } catch {
    return NextResponse.json({ logos: [] }, { status: 200 });
  }
}
