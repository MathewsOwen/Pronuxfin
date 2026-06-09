import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/security/distributed-rate-limit";

function isStrictProductionEnv(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

/** IP do cliente a partir de um Request (Route Handlers / testes). */
export function clientIpFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || "unknown";
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
  /** Prefer Request headers (evita `headers()` fora do scope em testes). */
  req?: Request;
};

/** Retorna resposta 429 ou `null` se dentro do limite (Postgres distribuído). */
export async function rateLimitResponse(
  keyPrefix: string,
  max: number,
  windowMs: number,
  options?: RateLimitResponseOptions,
): Promise<NextResponse | null> {
  const ip = options?.req
    ? clientIpFromRequest(options.req)
    : await clientIpFromHeaders();
  const key = `${keyPrefix}:${ip}`;
  const failClosed = options?.failClosed ?? isStrictProductionEnv();
  const result = await consumeRateLimit(key, max, windowMs, { failClosed });
  if (result.ok) return null;

  const retryAfterSec = result.retryAfterSec;
  const res = NextResponse.json(
    { error: "rate_limited", retryAfterSec },
    { status: 429 },
  );
  res.headers.set("Retry-After", String(retryAfterSec));
  res.headers.set("Cache-Control", "no-store");
  const rid = options?.req?.headers.get("x-request-id")?.trim();
  if (rid) res.headers.set("x-request-id", rid);
  return res;
}
