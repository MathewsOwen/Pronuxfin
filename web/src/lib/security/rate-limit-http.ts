import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { allowWithinWindow } from "@/lib/security/simple-rate-limit";

/** IP do cliente (confiar em X-Forwarded-For só atrás de proxy confiável). */
export async function clientIpFromHeaders(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip")?.trim() || "unknown";
}

/** Retorna resposta 429 ou `null` se dentro do limite. */
export async function rateLimitResponse(
  keyPrefix: string,
  max: number,
  windowMs: number,
): Promise<NextResponse | null> {
  const ip = await clientIpFromHeaders();
  const key = `${keyPrefix}:${ip}`;
  if (allowWithinWindow(key, max, windowMs)) return null;

  const retryAfterSec = Math.max(1, Math.ceil(windowMs / 1000));
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
