import { NextResponse } from "next/server";
import { jsonPayloadHeaders } from "@/lib/auth/forward-request-headers";
import { normalizeUpstreamAuthError } from "@/lib/auth/upstream-auth-error";
import { attachRequestId } from "@/lib/http/request-id";
import { readRequestJson } from "@/lib/http/read-json-body";
import { apiBaseUrl, fetchAuthUpstream } from "@/lib/http/upstream-auth-fetch";
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

  if (!apiBaseUrl()) {
    return attachRequestId(
      req,
      NextResponse.json(
        {
          message: "API_URL is not configured on this server.",
          code: "API_MISCONFIGURED",
        },
        { status: 500 },
      ),
    );
  }

  const parsedBody = await readRequestJson(req);
  if (!parsedBody.ok) {
    return attachRequestId(req, parsedBody.response);
  }

  let res: Response;
  try {
    res = await fetchAuthUpstream("/auth/forgot-password", {
      method: "POST",
      headers: jsonPayloadHeaders(req),
      body: JSON.stringify(parsedBody.value),
    });
  } catch {
    return attachRequestId(
      req,
      NextResponse.json(
        { message: "Auth service unavailable.", code: "UPSTREAM_UNAVAILABLE" },
        { status: 502 },
      ),
    );
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const { message, code } = normalizeUpstreamAuthError(
      data,
      "Unable to recover access.",
    );
    return attachRequestId(
      req,
      NextResponse.json(
        { message, ...(code ? { code } : {}) },
        { status: res.status },
      ),
    );
  }

  return attachRequestId(req, NextResponse.json({ ok: true }));
}
