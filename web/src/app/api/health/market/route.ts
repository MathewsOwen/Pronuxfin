import { NextResponse } from "next/server";

import { evaluateMarketCapabilities } from "@/lib/market/market-capabilities";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const capabilities = evaluateMarketCapabilities();

  const body = {
    ok: capabilities.readyForLiveDesk,
    service: "pronuxfin-web",
    check: "market" as const,
    timestamp: new Date().toISOString(),
    capabilities,
  };

  const res = NextResponse.json(body, {
    status: capabilities.readyForLiveDesk ? 200 : 503,
  });
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
