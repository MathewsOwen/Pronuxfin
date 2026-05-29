import { prisma } from "@/lib/prisma";
import { allowWithinWindow } from "@/lib/security/simple-rate-limit";

export type RateLimitResult = { ok: boolean; retryAfterSec: number };

/**
 * Fixed-window rate limit backed by Postgres so the counter is shared across
 * every serverless instance (the in-memory limiter only protects one process).
 *
 * On any DB error we fail open to the in-memory limiter — availability of auth
 * must not depend on the rate-limit table, and the in-memory pass still clips
 * bursts per instance.
 */
export async function consumeRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const bucket = Math.floor(now / windowMs);
  const windowKey = `${key}:${bucket}`;
  const windowEndsAt = (bucket + 1) * windowMs;
  const expiresAt = new Date(windowEndsAt);
  const retryAfterSec = Math.max(1, Math.ceil((windowEndsAt - now) / 1000));

  try {
    const row = await prisma.authRateLimit.upsert({
      where: { id: windowKey },
      create: { id: windowKey, count: 1, expiresAt },
      update: { count: { increment: 1 } },
    });

    // Opportunistic cleanup of expired counters (cheap, runs ~2% of calls).
    if (Math.random() < 0.02) {
      await prisma.authRateLimit
        .deleteMany({ where: { expiresAt: { lt: new Date() } } })
        .catch(() => {});
    }

    return { ok: row.count <= max, retryAfterSec };
  } catch {
    const ok = allowWithinWindow(windowKey, max, windowMs);
    return { ok, retryAfterSec };
  }
}
