import { NextResponse } from "next/server";

import { isInternalApiProbe } from "@/lib/security/secure-compare";
import { evaluateMarketCapabilities } from "@/lib/market/market-capabilities";
import { isProductionRuntime } from "@/lib/env/server-env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
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
