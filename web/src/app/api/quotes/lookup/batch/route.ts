import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth/require-session-user";
import { lookupSymbolQuotesBatch } from "@/lib/market/lookup-symbol-quotes-batch";
import { parseZodBody } from "@/lib/http/parse-zod-body";
import { assertMutationAllowed } from "@/lib/security/mutation-guard";
import { allowWithinWindow } from "@/lib/security/simple-rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LOOKUP_WINDOW_MS = 60_000;
const LOOKUP_MAX_PER_WINDOW = 12;

const bodySchema = z.object({
  symbols: z.array(z.string().min(1).max(16)).min(1).max(15),
});

export async function POST(req: Request) {
  const csrfBlocked = assertMutationAllowed(req);
  if (csrfBlocked) return csrfBlocked;

  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const rip = forwarded || h.get("x-real-ip")?.trim() || "unknown";
  const rateKey = `quotes-lookup-batch:${session.userId}:${rip}`;

  if (!allowWithinWindow(rateKey, LOOKUP_MAX_PER_WINDOW, LOOKUP_WINDOW_MS)) {
    return NextResponse.json(
      { ok: false as const, error: "rate_limited", retryAfterSec: 60 },
      { status: 429 },
    );
  }

  const parsed = await parseZodBody(req, bodySchema);
  if (!parsed.ok) return parsed.response;

  const { results, truncated } = await lookupSymbolQuotesBatch(parsed.data.symbols);

  const res = NextResponse.json({
    ok: true as const,
    results,
    truncated,
    fetchedAt: Date.now(),
  });
  res.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  return res;
}
