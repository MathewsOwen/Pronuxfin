import { NextResponse } from "next/server";
import { forwardAuthPost } from "@/lib/auth/auth-upstream-proxy";
import { normalizeUpstreamAuthError } from "@/lib/auth/upstream-auth-error";
import { attachRequestId } from "@/lib/http/request-id";
import {
  authRateLimitedResponse,
  getRateLimitClientKey,
  rateLimitForgotPassword,
} from "@/lib/security/auth-rate-limit";

export async function POST(req: Request) {
  const clientKey = getRateLimitClientKey(req);
  const limited = rateLimitForgotPassword(clientKey);
  if (!limited.ok) {
    return attachRequestId(
      req,
      authRateLimitedResponse(
        limited.retryAfterSec,
        "AUTH_RATE_LIMIT_FORGOT_PASSWORD",
      ),
    );
  }

  const forwarded = await forwardAuthPost(req, "/auth/forgot-password");
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
