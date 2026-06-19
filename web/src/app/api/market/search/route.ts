import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth/session-user";
import { searchGlobalAssets } from "@/lib/market/search-global-assets";
import { rateLimitResponse } from "@/lib/security/rate-limit-http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SEARCH_WINDOW_MS = 60_000;
const SEARCH_MAX_ANONYMOUS = 10;
const SEARCH_MAX_AUTHENTICATED = 30;

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  const authenticated = Boolean(userId);

  const limited = await rateLimitResponse(
    authenticated ? "market-search:auth" : "market-search:anon",
    authenticated ? SEARCH_MAX_AUTHENTICATED : SEARCH_MAX_ANONYMOUS,
    SEARCH_WINDOW_MS,
    { failClosed: true, req },
  );
  if (limited) return limited;

  const url = new URL(req.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const limitRaw = Number(url.searchParams.get("limit") ?? "16");
  const limit = Number.isFinite(limitRaw)
    ? Math.min(24, Math.max(1, Math.floor(limitRaw)))
    : 16;

  if (query.length < 2) {
    return NextResponse.json(
      { error: "query_too_short", minLength: 2 },
      { status: 400 },
    );
  }

  if (query.length > 64) {
    return NextResponse.json({ error: "query_too_long", maxLength: 64 }, { status: 400 });
  }

  const payload = await searchGlobalAssets(query, limit, {
    includeUpstream: authenticated,
  });
  const res = NextResponse.json(payload);
  res.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  return res;
}
