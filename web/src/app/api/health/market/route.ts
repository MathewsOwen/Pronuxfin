import { NextResponse } from "next/server";

import { isInternalApiProbe } from "@/lib/security/secure-compare";
import { evaluateMarketCapabilities } from "@/lib/market/market-capabilities";
import { isProductionRuntime } from "@/lib/env/server-env";
import { rateLimitResponse } from "@/lib/security/rate-limit-http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MARKET_HEALTH_WINDOW_MS = 60_000;
const MARKET_HEALTH_MAX_PER_IP = 60;

export async function GET(req: Request) {
  const limited = await rateLimitResponse(
    "health-market",
    MARKET_HEALTH_MAX_PER_IP,
    MARKET_HEALTH_WINDOW_MS,
    { failClosed: false, req },
  );
  if (limited) return limited;

  const capabilities = evaluateMarketCapabilities();
  const ok = capabilities.readyForLiveDesk;

  if (isProductionRuntime() && !isInternalApiProbe(req)) {
    const body = {
      ok,
      service: "pronuxfin-web",
      check: "market" as const,
      timestamp: new Date().toISOString(),
    };
    const res = NextResponse.json(body, { status: ok ? 200 : 503 });
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  }

  const body = {
    ok,
    service: "pronuxfin-web",
    check: "market" as const,
    timestamp: new Date().toISOString(),
    capabilities,
  };

  const res = NextResponse.json(body, { status: ok ? 200 : 503 });
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
