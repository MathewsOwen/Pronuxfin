import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/security/distributed-rate-limit";

function isStrictProductionEnv(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

/** IP do cliente (confiar em X-Forwarded-For só atrás de proxy confiável). */
export async function clientIpFromHeaders(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip")?.trim() || "unknown";
}

export type RateLimitResponseOptions = {
  /** Deny when Postgres is unavailable (auth/sensitive). Public read APIs should use false. */
  failClosed?: boolean;
};

/** Retorna resposta 429 ou `null` se dentro do limite (Postgres distribuído). */
export async function rateLimitResponse(
  keyPrefix: string,
  max: number,
  windowMs: number,
  options?: RateLimitResponseOptions,
): Promise<NextResponse | null> {
  const ip = await clientIpFromHeaders();
  const key = `${keyPrefix}:${ip}`;
  const failClosed = options?.failClosed ?? isStrictProductionEnv();
  const result = await consumeRateLimit(key, max, windowMs, { failClosed });
  if (result.ok) return null;

  const retryAfterSec = result.retryAfterSec;
  const h = await headers();
  const res = NextResponse.json(
    { error: "rate_limited", retryAfterSec },
    { status: 429 },
  );
  res.headers.set("Retry-After", String(retryAfterSec));
  res.headers.set("Cache-Control", "no-store");
  const rid = h.get("x-request-id");
  if (rid) res.headers.set("x-request-id", rid);
  return res;
}
