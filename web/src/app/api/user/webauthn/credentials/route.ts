import { NextResponse } from "next/server";

import {
  forwardAuthPostWithBody,
  isForwardAuthError,
} from "@/lib/auth/forward-auth-session";
import { requireSessionUser } from "@/lib/auth/require-session-user";
import { readRequestJson } from "@/lib/http/read-json-body";
import { assertMutationAllowed } from "@/lib/security/mutation-guard";
import { rateLimitUserMutation } from "@/lib/security/user-mutation-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const forwarded = await forwardAuthPostWithBody(
    new Request("http://localhost"),
    "/auth/webauthn/list",
    {},
  );
  if (isForwardAuthError(forwarded)) return forwarded.error;

  return NextResponse.json(forwarded.data, { status: forwarded.upstream.status });
}

export async function DELETE(req: Request) {
  const csrfBlocked = assertMutationAllowed(req);
  if (csrfBlocked) return csrfBlocked;

  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const limited = await rateLimitUserMutation(session.userId, "webauthn-remove", 10);
  if (limited) return limited;

  const raw = await readRequestJson(req);
  if (!raw.ok) {
    return NextResponse.json({ ok: false, message: "Pedido inválido." }, { status: raw.response.status });
  }

  const payload = raw.value as Record<string, unknown>;
  const credentialId =
    typeof payload.credentialId === "string" ? payload.credentialId.trim() : "";
  if (!credentialId) {
    return NextResponse.json({ ok: false, message: "Passkey inválida." }, { status: 400 });
  }

  const forwarded = await forwardAuthPostWithBody(req, "/auth/webauthn/remove", {
    credentialId,
  });
  if (isForwardAuthError(forwarded)) return forwarded.error;

  return NextResponse.json(forwarded.data, { status: forwarded.upstream.status });
}
