import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { clearAuthCookies } from "@/lib/auth/auth-session-cookies";
import { readRefreshCookieValue } from "@/lib/auth/auth-cookie-names";
import { apiBaseUrl, fetchAuthUpstream } from "@/lib/http/upstream-auth-fetch";
import { assertMutationAllowed } from "@/lib/security/mutation-guard";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const csrfBlocked = assertMutationAllowed(req);
  if (csrfBlocked) return csrfBlocked;

  const jar = await cookies();
  const refresh = readRefreshCookieValue(jar);

  // Best-effort server-side revocation; local cookies are cleared regardless.
  if (refresh && apiBaseUrl()) {
    try {
      await fetchAuthUpstream("/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
    } catch {
      /* swallow — never block logout on upstream issues */
    }
  }

  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  if (process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true") {
    res.headers.set("Clear-Site-Data", '"cookies"');
  }
  return res;
}
