import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { loadQuotesPayload } from "@/lib/market/load-quotes-payload";
import { allowWithinWindow } from "@/lib/security/simple-rate-limit";

/** Sem cache de rota / CDN: cada GET consulta brapi + CoinGecko na hora. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Limite por IP para proteger BRAPI/CoinGecko (instância única; usar Redis em escala). */
const QUOTES_WINDOW_MS = 60_000;
const QUOTES_MAX_PER_WINDOW = 72;

export async function GET() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const rip = forwarded || h.get("x-real-ip")?.trim() || "unknown";
  const rateKey = `quotes:${rip}`;

  if (!allowWithinWindow(rateKey, QUOTES_MAX_PER_WINDOW, QUOTES_WINDOW_MS)) {
    const res = NextResponse.json(
      { error: "rate_limited", retryAfterSec: 60 },
      { status: 429 },
    );
    res.headers.set("Retry-After", "60");
    res.headers.set("Cache-Control", "no-store");
    const rid = h.get("x-request-id");
    if (rid) res.headers.set("x-request-id", rid);
    return res;
  }

  const { payload, warnings } = await loadQuotesPayload();

  const res = NextResponse.json(
    warnings.length ? { ...payload, warnings } : payload,
  );
  res.headers.set(
    "Cache-Control",
    "private, no-store, max-age=0, must-revalidate",
  );
  const rid = h.get("x-request-id");
  if (rid) res.headers.set("x-request-id", rid);
  return res;
}
