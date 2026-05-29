import { NextResponse } from "next/server";

import { applyAuthCookies } from "@/lib/auth/auth-session-cookies";
import {
  forwardAuthPostWithBody,
  isForwardAuthError,
} from "@/lib/auth/forward-auth-session";
import { normalizeUpstreamAuthError } from "@/lib/auth/upstream-auth-error";
import { attachRequestId } from "@/lib/http/request-id";
import { readRequestJson } from "@/lib/http/read-json-body";
import { assertAuthEntryAllowed } from "@/lib/security/mutation-guard";

export async function POST(req: Request) {
  const entryBlocked = assertAuthEntryAllowed(req);
  if (entryBlocked) return attachRequestId(req, entryBlocked);

  const parsed = await readRequestJson(req);
  if (!parsed.ok) return attachRequestId(req, parsed.response);

  const forwarded = await forwardAuthPostWithBody(
    req,
    "/auth/webauthn/login/verify",
    parsed.value as Record<string, unknown>,
  );
  if (isForwardAuthError(forwarded)) return attachRequestId(req, forwarded.error);

  if (!forwarded.upstream.ok) {
    const { message, code } = normalizeUpstreamAuthError(forwarded.data, "Passkey verification failed.");
    return attachRequestId(
      req,
      NextResponse.json({ message, ...(code ? { code } : {}) }, { status: forwarded.upstream.status }),
    );
  }

  const response = NextResponse.json({ ok: true });
  if (!applyAuthCookies(response, forwarded.data)) {
    return attachRequestId(
      req,
      NextResponse.json(
        { message: "Upstream auth response missing token.", code: "INVALID_AUTH_RESPONSE" },
        { status: 502 },
      ),
    );
  }

  return attachRequestId(req, response);
}
