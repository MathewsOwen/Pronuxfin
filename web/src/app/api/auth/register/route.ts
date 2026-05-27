import { NextResponse } from "next/server";

import { secureAuthCookie } from "@/lib/auth/cookie-settings";
import { AUTH_COOKIE } from "@/lib/constants";
import { forwardAuthPost } from "@/lib/auth/auth-upstream-proxy";
import { normalizeUpstreamAuthError } from "@/lib/auth/upstream-auth-error";
import { readPositiveIntEnv } from "@/lib/env/numeric-env";
import { attachRequestId } from "@/lib/http/request-id";
import {
  authRateLimitedResponse,
  getRateLimitClientKey,
  rateLimitRegister,
} from "@/lib/security/auth-rate-limit";

export async function POST(req: Request) {
  const clientKey = getRateLimitClientKey(req);
  const limited = rateLimitRegister(clientKey);
  if (!limited.ok) {
    return attachRequestId(
      req,
      authRateLimitedResponse(limited.retryAfterSec, "AUTH_RATE_LIMIT_REGISTER"),
    );
  }

  const forwarded = await forwardAuthPost(req, "/auth/register");
  if (forwarded.error) {
    return attachRequestId(req, forwarded.error);
  }

  const data = forwarded.data as Record<string, unknown> & {
    access_token?: string;
  };

  if (!forwarded.upstream.ok) {
    const { message, code } = normalizeUpstreamAuthError(
      data,
      "Unable to create account.",
    );
    return attachRequestId(
      req,
      NextResponse.json(
        { message, ...(code ? { code } : {}) },
        { status: forwarded.upstream.status },
      ),
    );
  }

  const token = data.access_token;
  if (!token || typeof token !== "string") {
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

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: secureAuthCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: readPositiveIntEnv("JWT_COOKIE_MAX_AGE", 604800),
  });

  return attachRequestId(req, response);
}
