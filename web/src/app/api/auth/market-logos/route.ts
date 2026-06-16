import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { loadAuthMarketLogos } from "@/lib/market/load-auth-market-logos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getCachedAuthMarketLogos = unstable_cache(
  loadAuthMarketLogos,
  ["auth-market-logos-v1"],
  { revalidate: 3600 },
);

/** Logos reais (BRAPI / CoinGecko / FMP) para o cenário de auth. */
export async function GET() {
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
