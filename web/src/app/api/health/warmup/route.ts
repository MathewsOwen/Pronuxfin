import { NextResponse } from "next/server";

import { warmAuthUpstream } from "@/lib/http/warm-auth-upstream";
import { rateLimitResponse } from "@/lib/security/rate-limit-http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** Render cold start pode levar ~50s. */
export const maxDuration = 60;

const WARMUP_WINDOW_MS = 60_000;
const WARMUP_MAX = 30;

export async function GET(req: Request) {
  const limited = await rateLimitResponse(
    "health-warmup",
    WARMUP_MAX,
    WARMUP_WINDOW_MS,
    { failClosed: false, req },
  );
  if (limited) return limited;

  const result = await warmAuthUpstream();
  const res = NextResponse.json(
    {
      ok: result.ok,
      service: "pronuxfin-web",
      check: "warmup" as const,
      uptime_sec: result.uptimeSec,
      timestamp: new Date().toISOString(),
    },
    { status: result.ok ? 200 : 504 },
  );
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
}
