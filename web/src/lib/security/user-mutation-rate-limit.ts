import { NextResponse } from "next/server";

import { consumeRateLimit } from "@/lib/security/distributed-rate-limit";

function envMs(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function envMax(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const WINDOW_MS = envMs("USER_MUTATION_RATE_LIMIT_WINDOW_MS", 60_000);

export async function rateLimitUserMutation(
  userId: string,
  bucket: string,
  max = envMax("USER_MUTATION_RATE_LIMIT_MAX", 40),
): Promise<NextResponse | null> {
  const result = await consumeRateLimit(
    `user:${bucket}:${userId}`,
    max,
    WINDOW_MS,
  );
  if (result.ok) return null;

  return NextResponse.json(
    {
      ok: false,
      code: "USER_RATE_LIMIT",
      message: "Muitas alterações em pouco tempo. Aguarde e tente de novo.",
      retryAfterSec: result.retryAfterSec,
    },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSec) },
    },
  );
}
