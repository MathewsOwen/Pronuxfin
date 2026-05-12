import { NextResponse } from "next/server";

/**
 * Health para load balancer / Compose / k8s probe.
 * Mantém-se barato: não consulta Postgres nem APIs externas.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const body = {
    status: "ok" as const,
    service: "pronuxfin-web",
    timestamp: new Date().toISOString(),
  };
  const res = NextResponse.json(body);
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
