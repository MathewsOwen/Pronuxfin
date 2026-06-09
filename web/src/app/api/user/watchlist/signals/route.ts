import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth/require-session-user";
import { parseZodBody } from "@/lib/http/parse-zod-body";
import { MAX_USER_MUTATION_BODY_BYTES } from "@/lib/http/read-json-body";
import { persistWatchlistSignalSnapshots } from "@/lib/user-watchlist/history";
import { listUserWatchlist } from "@/lib/user-watchlist/load";
import { assertMutationAllowed } from "@/lib/security/mutation-guard";
import { rateLimitUserMutation } from "@/lib/security/user-mutation-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const signalSchema = z.object({
  symbol: z.string().min(1).max(16),
  priority: z.number().int().min(0).max(100),
  attentionLevel: z.enum(["high", "medium", "baseline"]),
  newsCount: z.number().int().min(0).max(999),
  moveAbs: z.number().min(0).max(1000),
  rangeProgress: z.number().int().min(0).max(100).nullable(),
  reasons: z
    .array(
      z.object({
        code: z.enum([
          "large_move",
          "news_flow",
          "near_52w_high",
          "near_52w_low",
          "live_history",
          "liquid",
        ]),
        value: z.number().optional(),
      }),
    )
    .max(5),
});

const bodySchema = z.object({
  signals: z.array(signalSchema).max(12),
});

export async function POST(req: Request) {
  const csrfBlocked = assertMutationAllowed(req);
  if (csrfBlocked) return csrfBlocked;

  const session = await requireSessionUser();
  if (!session.ok) return session.response;
  const { userId } = session;

  const limited = await rateLimitUserMutation(userId, "watchlist-signals", 30);
  if (limited) return limited;

  const parsed = await parseZodBody(req, bodySchema, {
    maxBytes: MAX_USER_MUTATION_BODY_BYTES,
  });
  if (!parsed.ok) return parsed.response;

  const watchlist = await listUserWatchlist(userId);
  const allowed = new Set(watchlist.map((item) => item.symbol));
  const filtered = parsed.data.signals.filter((item) => allowed.has(item.symbol));

  await persistWatchlistSignalSnapshots(
    userId,
    filtered.map((item) => ({
      symbol: item.symbol,
      signal: {
        priority: item.priority,
        attentionLevel: item.attentionLevel,
        reasons: item.reasons,
        newsCount: item.newsCount,
        moveAbs: item.moveAbs,
        rangeProgress: item.rangeProgress,
      },
    })),
  );

  return NextResponse.json({
    ok: true as const,
    saved: filtered.length,
  });
}
