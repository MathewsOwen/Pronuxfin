import { NextResponse } from "next/server";

import {
  forwardAuthPostWithBody,
  isForwardAuthError,
} from "@/lib/auth/forward-auth-session";
import { normalizeUpstreamAuthError } from "@/lib/auth/upstream-auth-error";
import { attachRequestId } from "@/lib/http/request-id";
import { assertAuthEntryAllowed } from "@/lib/security/mutation-guard";
import {
  authRateLimitedResponse,
  getRateLimitClientKey,
  rateLimitWebAuthn,
} from "@/lib/security/auth-rate-limit";
import { readRequestJson } from "@/lib/http/read-json-body";
import { webauthnLoginOptionsBodySchema } from "@/lib/validations/auth-server-schemas";

export async function POST(req: Request) {
  const entryBlocked = assertAuthEntryAllowed(req);
  if (entryBlocked) return attachRequestId(req, entryBlocked);

  const limited = await rateLimitWebAuthn(getRateLimitClientKey(req));
  if (!limited.ok) {
    return attachRequestId(
      req,
      authRateLimitedResponse(limited.retryAfterSec, "AUTH_RATE_LIMIT_WEBAUTHN"),
    );
  }

  const parsed = await readRequestJson(req);
  if (!parsed.ok) return attachRequestId(req, parsed.response);

  const body = webauthnLoginOptionsBodySchema.safeParse(parsed.value);
  if (!body.success) {
    return attachRequestId(
      req,
      NextResponse.json(
        { message: "Invalid challenge.", code: "VALIDATION_FAILED" },
        { status: 400 },
      ),
    );
  }

  const forwarded = await forwardAuthPostWithBody(req, "/auth/webauthn/login/options", {
    challengeId: body.data.challengeId,
  });
  if (isForwardAuthError(forwarded)) return attachRequestId(req, forwarded.error);

  if (!forwarded.upstream.ok) {
    const { message, code } = normalizeUpstreamAuthError(forwarded.data, "Passkey step failed.");
    return attachRequestId(
      req,
      NextResponse.json({ message, ...(code ? { code } : {}) }, { status: forwarded.upstream.status }),
    );
  }

  return attachRequestId(req, NextResponse.json(forwarded.data));
}
