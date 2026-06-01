import { NextResponse } from "next/server";

import {
  forwardAuthPostMerge,
  isForwardAuthError,
} from "@/lib/auth/forward-auth-session";
import { requireSessionUser } from "@/lib/auth/require-session-user";
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

  const forwarded = await forwardAuthPostMerge(
    req,
    "/auth/webauthn/register/verify",
    {},
  );
  if (isForwardAuthError(forwarded)) {
    return attachRequestId(req, forwarded.error);
  }

  const { upstream, data } = forwarded;
  return attachRequestId(req, NextResponse.json(data, { status: upstream.status }));
}
