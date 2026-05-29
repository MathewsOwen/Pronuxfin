import { NextResponse } from "next/server";

import {
  forwardAuthPostWithBody,
  isForwardAuthError,
} from "@/lib/auth/forward-auth-session";
import { normalizeUpstreamAuthError } from "@/lib/auth/upstream-auth-error";
import { attachRequestId } from "@/lib/http/request-id";
import { assertAuthEntryAllowed } from "@/lib/security/mutation-guard";
import { readRequestJson } from "@/lib/http/read-json-body";

export async function POST(req: Request) {
  const entryBlocked = assertAuthEntryAllowed(req);
  if (entryBlocked) return attachRequestId(req, entryBlocked);

  const parsed = await readRequestJson(req);
  if (!parsed.ok) return attachRequestId(req, parsed.response);

  const payload = parsed.value as Record<string, unknown>;
  const challengeId =
    typeof payload.challengeId === "string" ? payload.challengeId.trim() : "";
  if (!challengeId) {
    return attachRequestId(
      req,
      NextResponse.json({ message: "Invalid challenge.", code: "VALIDATION_FAILED" }, { status: 400 }),
    );
  }

  const forwarded = await forwardAuthPostWithBody(req, "/auth/webauthn/login/options", {
    challengeId,
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
