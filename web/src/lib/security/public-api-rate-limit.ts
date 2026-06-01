import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { consumeRateLimit } from "@/lib/security/distributed-rate-limit";

function isStrictProductionEnv(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

export async function getPublicApiClientKey(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const rip = forwarded || h.get("x-real-ip")?.trim() || "unknown";
  return `ip:${rip}`;
}

export async function rateLimitPublicApi(
  bucket: string,
  max: number,
  windowMs: number,
): Promise<NextResponse | null> {
  const key = await getPublicApiClientKey();
  const result = await consumeRateLimit(`public:${bucket}:${key}`, max, windowMs, {
    failClosed: isStrictProductionEnv(),
  });
  if (result.ok) return null;

  const res = NextResponse.json(
    { error: "rate_limited", retryAfterSec: result.retryAfterSec },
    { status: 429 },
  );
  res.headers.set("Retry-After", String(result.retryAfterSec));
  res.headers.set("Cache-Control", "no-store");
  return res;
}