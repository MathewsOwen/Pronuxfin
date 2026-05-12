import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUserId } from "@/lib/auth/session-user";
import { persistWatchlistSignalSnapshots } from "@/lib/user-watchlist/history";
import { listUserWatchlist } from "@/lib/user-watchlist/load";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const unauthorized = NextResponse.json(
  { ok: false as const, message: "Sessão necessária." },
  { status: 401 },
);

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
  const userId = await getSessionUserId();
  if (!userId) return unauthorized;

  let body: z.infer<typeof bodySchema>;
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false as const, message: "Body inválido para histórico da watchlist." },
        { status: 400 },
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json(
      { ok: false as const, message: "JSON inválido no corpo." },
      { status: 400 },
    );
  }

  const watchlist = await listUserWatchlist(userId);
  const allowed = new Set(watchlist.map((item) => item.symbol));
  const filtered = body.signals.filter((item) => allowed.has(item.symbol));

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
