import { NextResponse } from "next/server";

import { rateLimitResponse } from "@/lib/security/rate-limit-http";

/**
 * Health para load balancer / Compose / k8s probe.
 * Mantém-se barato: não consulta Postgres nem APIs externas.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PING_WINDOW_MS = 60_000;
const PING_MAX_PER_IP = 120;

export async function GET(req: Request) {
  const limited = await rateLimitResponse(
    "health-ping",
    PING_MAX_PER_IP,
    PING_WINDOW_MS,
    { failClosed: false, req },
  );
  if (limited) return limited;

  const body = {
    status: "ok" as const,
    service: "pronuxfin-web",
    timestamp: new Date().toISOString(),
  };
  const res = NextResponse.json(body);
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
