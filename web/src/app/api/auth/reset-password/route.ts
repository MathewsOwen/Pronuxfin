import { NextResponse } from "next/server";
import { jsonPayloadHeaders } from "@/lib/auth/forward-request-headers";
import { normalizeUpstreamAuthError } from "@/lib/auth/upstream-auth-error";
import { attachRequestId } from "@/lib/http/request-id";
import { readRequestJson } from "@/lib/http/read-json-body";
import {
  authRateLimitedResponse,
  getRateLimitClientKey,
  rateLimitResetPassword,
} from "@/lib/security/auth-rate-limit";

export async function POST(req: Request) {
  const clientKey = getRateLimitClientKey(req);
  const limited = rateLimitResetPassword(clientKey);
  if (!limited.ok) {
    return attachRequestId(
      req,
      authRateLimitedResponse(
        limited.retryAfterSec,
        "AUTH_RATE_LIMIT_RESET_PASSWORD",
      ),
    );
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
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

  const res = await fetch(`${apiUrl}/auth/reset-password`, {
    method: "POST",
    headers: jsonPayloadHeaders(req),
    body: JSON.stringify(parsedBody.value),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const { message, code } = normalizeUpstreamAuthError(
      data,
      "Unable to reset password.",
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
