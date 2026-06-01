import { NextResponse } from "next/server";

import { evaluateMarketCapabilities } from "@/lib/market/market-capabilities";
import { isProductionRuntime } from "@/lib/env/server-env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isInternalProbe(req: Request): boolean {
  const secret = process.env.INTERNAL_API_SECRET?.trim();
  if (!secret) return false;
  const provided = req.headers.get("x-internal-auth")?.trim();
  return provided === secret;
}

export async function GET(req: Request) {
  const capabilities = evaluateMarketCapabilities();
  const ok = capabilities.readyForLiveDesk;

  if (isProductionRuntime() && !isInternalProbe(req)) {
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
