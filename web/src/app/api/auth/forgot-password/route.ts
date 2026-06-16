import { NextResponse } from "next/server";
import { forwardAuthPost } from "@/lib/auth/auth-upstream-proxy";
import { normalizeUpstreamAuthError } from "@/lib/auth/upstream-auth-error";
import { attachRequestId } from "@/lib/http/request-id";
import {
  authRateLimitedResponse,
  getRateLimitClientKey,
  rateLimitForgotPassword,
} from "@/lib/security/auth-rate-limit";
import { assertAuthEntryAllowed } from "@/lib/security/mutation-guard";
import { authForgotPasswordBodySchema } from "@/lib/validations/auth-server-schemas";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  const entryBlocked = assertAuthEntryAllowed(req);
  if (entryBlocked) return attachRequestId(req, entryBlocked);

  const clientKey = getRateLimitClientKey(req);
  const limited = await rateLimitForgotPassword(clientKey);
  if (!limited.ok) {
    return attachRequestId(
      req,
      authRateLimitedResponse(
        limited.retryAfterSec,
        "AUTH_RATE_LIMIT_FORGOT_PASSWORD",
      ),
    );
  }

  const forwarded = await forwardAuthPost(
    req,
    "/auth/forgot-password",
    authForgotPasswordBodySchema,
  );
  if (forwarded.error) {
    return attachRequestId(req, forwarded.error);
  }

  if (!forwarded.upstream.ok) {
    const { message, code } = normalizeUpstreamAuthError(
      forwarded.data,
      "Unable to recover access.",
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
