import { NextResponse } from "next/server";

import { clearAuthCookies } from "@/lib/auth/auth-session-cookies";
import { requireSessionUser } from "@/lib/auth/require-session-user";
import { revokeAllUserSessions } from "@/lib/auth/user-sessions";
import { assertMutationAllowed } from "@/lib/security/mutation-guard";
import { logUserSecurityEvent } from "@/lib/security/log-user-security-event";
import { rateLimitUserMutation } from "@/lib/security/user-mutation-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const csrfBlocked = assertMutationAllowed(req);
  if (csrfBlocked) return csrfBlocked;

  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const limited = await rateLimitUserMutation(session.userId, "sessions-revoke-all", 8);
  if (limited) return limited;

  try {
    await revokeAllUserSessions(session.userId);
    await logUserSecurityEvent(session.userId, "SESSION_REVOKED_ALL", {});
    const res = NextResponse.json({ ok: true, signedOut: true });
    clearAuthCookies(res);
    if (process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true") {
      res.headers.set("Clear-Site-Data", '"cookies"');
    }
    return res;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Não foi possível terminar todas as sessões." },
      { status: 500 },
    );
  }
}
