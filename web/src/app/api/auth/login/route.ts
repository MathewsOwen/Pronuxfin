import { NextResponse } from "next/server";

import { applyAuthCookies } from "@/lib/auth/auth-session-cookies";
import { forwardAuthPost } from "@/lib/auth/auth-upstream-proxy";
import { normalizeUpstreamAuthError } from "@/lib/auth/upstream-auth-error";
import { attachRequestId } from "@/lib/http/request-id";
import {
  authRateLimitedResponse,
  getRateLimitClientKey,
  rateLimitLogin,
} from "@/lib/security/auth-rate-limit";
import { assertAuthEntryAllowed } from "@/lib/security/mutation-guard";
import { authLoginBodySchema } from "@/lib/validations/auth-server-schemas";

export async function POST(req: Request) {
  const entryBlocked = assertAuthEntryAllowed(req);
  if (entryBlocked) return attachRequestId(req, entryBlocked);

  const clientKey = getRateLimitClientKey(req);
  const limited = await rateLimitLogin(clientKey);
  if (!limited.ok) {
    return attachRequestId(
      req,
      authRateLimitedResponse(limited.retryAfterSec, "AUTH_RATE_LIMIT_LOGIN"),
    );
  }

  const forwarded = await forwardAuthPost(req, "/auth/login", authLoginBodySchema);
  if (forwarded.error) {
    return attachRequestId(req, forwarded.error);
  }
  const data = forwarded.data as Record<string, unknown>;

  if (!forwarded.upstream.ok) {
    const { message, code } = normalizeUpstreamAuthError(data, "Unable to sign in.");
    return attachRequestId(
      req,
      NextResponse.json(
        { message, ...(code ? { code } : {}) },
        { status: forwarded.upstream.status },
      ),
    );
  }

  if (data.webauthnRequired === true && typeof data.challengeId === "string") {
    return attachRequestId(
      req,
      NextResponse.json({
        ok: true,
        webauthnRequired: true,
        challengeId: data.challengeId,
        expiresIn: data.expiresIn ?? 300,
      }),
    );
  }

  const response = NextResponse.json({ ok: true });
  if (!applyAuthCookies(response, data)) {
    return attachRequestId(
      req,
      NextResponse.json(
        {
          message: "Upstream auth response missing token.",
          code: "INVALID_AUTH_RESPONSE",
        },
        { status: 502 },
      ),
    );
  }

  return attachRequestId(req, response);
}
