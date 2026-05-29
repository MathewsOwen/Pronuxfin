import { NextResponse } from "next/server";

import {
  forwardAuthPostWithBody,
  isForwardAuthError,
} from "@/lib/auth/forward-auth-session";
import { requireSessionUser } from "@/lib/auth/require-session-user";
import { getCurrentUser } from "@/lib/session";
import { attachRequestId } from "@/lib/http/request-id";
import { assertMutationAllowed } from "@/lib/security/mutation-guard";
import { rateLimitUserMutation } from "@/lib/security/user-mutation-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const csrfBlocked = assertMutationAllowed(req);
  if (csrfBlocked) return attachRequestId(req, csrfBlocked);

  const session = await requireSessionUser();
  if (!session.ok) return attachRequestId(req, session.response);

  const limited = await rateLimitUserMutation(session.userId, "webauthn-register", 10);
  if (limited) return attachRequestId(req, limited);

  const user = await getCurrentUser();
  if (!user?.email) {
    return attachRequestId(
      req,
      NextResponse.json({ ok: false, message: "Sessão inválida." }, { status: 401 }),
    );
  }

  const forwarded = await forwardAuthPostWithBody(
    req,
    "/auth/webauthn/register/options",
    { userId: session.userId, email: user.email },
  );
  if (isForwardAuthError(forwarded)) return attachRequestId(req, forwarded.error);

  return attachRequestId(
    req,
    NextResponse.json(forwarded.data, { status: forwarded.upstream.status }),
  );
}
