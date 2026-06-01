import { NextResponse } from "next/server";

import { lookupSymbolQuote } from "@/lib/market/lookup-symbol-quote";
import { rateLimitResponse } from "@/lib/security/rate-limit-http";
import {
  isValidWatchlistSymbol,
  normalizeWatchlistSymbol,
} from "@/lib/user-watchlist/load";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LOOKUP_WINDOW_MS = 60_000;
const LOOKUP_MAX_PER_WINDOW = 40;

export async function GET(req: Request) {
  const limited = await rateLimitResponse(
    "quotes-lookup",
    LOOKUP_MAX_PER_WINDOW,
    LOOKUP_WINDOW_MS,
  );
  if (limited) return limited;

  const url = new URL(req.url);
  const symbol = normalizeWatchlistSymbol(url.searchParams.get("symbol") ?? "");
  if (!symbol || !isValidWatchlistSymbol(symbol)) {
    return NextResponse.json(
      { ok: false as const, message: "Símbolo inválido." },
      { status: 400 },
    );
  }

  const lookup = await lookupSymbolQuote(symbol);
  if (!lookup.quote?.regularMarketPrice) {
    return NextResponse.json(
      {
        ok: false as const,
        message: "Cotação indisponível para este símbolo no momento.",
        dataMode: lookup.dataMode,
        simulated: lookup.simulated,
      },
      { status: 404 },
    );
  }

  const res = NextResponse.json({
    ok: true as const,
    quote: lookup.quote,
    simulated: lookup.simulated,
    dataMode: lookup.dataMode,
    fetchedAt: Date.now(),
  });
  res.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  return res;
}
