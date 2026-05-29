import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  applyAuthCookies,
  clearAuthCookies,
} from "@/lib/auth/auth-session-cookies";
import { readRefreshCookieValue } from "@/lib/auth/auth-cookie-names";
import { safeInternalRedirectPath } from "@/lib/http/safe-redirect-path";
import { apiBaseUrl, fetchAuthUpstream } from "@/lib/http/upstream-auth-fetch";
import { assertMutationAllowed } from "@/lib/security/mutation-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function rotateRefreshToken(
  refresh: string,
): Promise<Record<string, unknown> | null> {
  if (!apiBaseUrl()) return null;
  try {
    const upstream = await fetchAuthUpstream("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!upstream.ok) return null;
    return (await upstream.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
  } catch {
    return null;
  }
}

/**
 * Silent refresh used by the middleware redirect: rotates the session and
 * sends the user back to where they were headed. On failure, drops the
 * cookies and routes to /login (a public path, so there is no redirect loop).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const dest = safeInternalRedirectPath(url.searchParams.get("from"));
  const jar = await cookies();
  const refresh = readRefreshCookieValue(jar);

  const loginRes = NextResponse.redirect(new URL("/login", url.origin));
  clearAuthCookies(loginRes);
  if (!refresh) return loginRes;

  const data = await rotateRefreshToken(refresh);
  if (!data) return loginRes;

  const res = NextResponse.redirect(new URL(dest, url.origin));
  if (!applyAuthCookies(res, data)) return loginRes;
  return res;
}

/** Programmatic refresh (client-driven) returning JSON. */
export async function POST(req: Request) {
  const csrfBlocked = assertMutationAllowed(req);
  if (csrfBlocked) return csrfBlocked;

  const jar = await cookies();
  const refresh = readRefreshCookieValue(jar);

  const fail = NextResponse.json(
    { ok: false, code: "AUTH_REFRESH_INVALID" },
    { status: 401 },
  );
  clearAuthCookies(fail);
  if (!refresh) return fail;

  const data = await rotateRefreshToken(refresh);
  if (!data) return fail;

  const res = NextResponse.json({ ok: true });
  if (!applyAuthCookies(res, data)) return fail;
  return res;
}
