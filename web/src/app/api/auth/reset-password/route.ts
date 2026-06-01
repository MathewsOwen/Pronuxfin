import { NextResponse } from "next/server";
import { forwardAuthPost } from "@/lib/auth/auth-upstream-proxy";
import { normalizeUpstreamAuthError } from "@/lib/auth/upstream-auth-error";
import { attachRequestId } from "@/lib/http/request-id";
import {
  authRateLimitedResponse,
  getRateLimitClientKey,
  rateLimitResetPassword,
} from "@/lib/security/auth-rate-limit";
import { assertAuthEntryAllowed } from "@/lib/security/mutation-guard";
import { authResetPasswordBodySchema } from "@/lib/validations/auth-server-schemas";

export async function POST(req: Request) {
  const entryBlocked = assertAuthEntryAllowed(req);
  if (entryBlocked) return attachRequestId(req, entryBlocked);

  const clientKey = getRateLimitClientKey(req);
  const limited = await rateLimitResetPassword(clientKey);
  if (!limited.ok) {
    return attachRequestId(
      req,
      authRateLimitedResponse(
        limited.retryAfterSec,
        "AUTH_RATE_LIMIT_RESET_PASSWORD",
      ),
    );
  }

  const forwarded = await forwardAuthPost(
    req,
    "/auth/reset-password",
    authResetPasswordBodySchema,
  );
  if (forwarded.error) {
    return attachRequestId(req, forwarded.error);
  }

  if (!forwarded.upstream.ok) {
    const { message, code } = normalizeUpstreamAuthError(
      forwarded.data,
      "Unable to reset password.",
    );
    return attachRequestId(
      req,
      NextResponse.json(
        { message, ...(code ? { code } : {}) },
        { status: forwarded.upstream.status },
      ),
    );
  }

  return attachRequestId(req, NextResponse.json({ ok: true }));
}
