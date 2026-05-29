import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { clearAuthCookies } from "@/lib/auth/auth-session-cookies";
import { readRefreshCookieValue } from "@/lib/auth/auth-cookie-names";
import { requireSessionUser } from "@/lib/auth/require-session-user";
import {
  listActiveUserSessions,
  resolveCurrentFamilyId,
  revokeUserSessionFamily,
} from "@/lib/auth/user-sessions";
import { readRequestJson } from "@/lib/http/read-json-body";
import { assertMutationAllowed } from "@/lib/security/mutation-guard";
import { logUserSecurityEvent } from "@/lib/security/log-user-security-event";
import { rateLimitUserMutation } from "@/lib/security/user-mutation-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  familyId: z.string().trim().min(8).max(64),
});

export async function POST(req: Request) {
  const csrfBlocked = assertMutationAllowed(req);
  if (csrfBlocked) return csrfBlocked;

  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const limited = await rateLimitUserMutation(session.userId, "sessions-revoke", 20);
  if (limited) return limited;

  const raw = await readRequestJson(req);
  if (!raw.ok) {
    return NextResponse.json(
      { ok: false, message: "Pedido inválido." },
      { status: raw.response.status },
    );
  }

  const parsed = schema.safeParse(raw.value);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Sessão inválida." }, { status: 400 });
  }

  try {
    const jar = await cookies();
    const currentFamilyId = await resolveCurrentFamilyId(
      readRefreshCookieValue(jar),
    );
    const active = await listActiveUserSessions(session.userId, currentFamilyId);
    const target = active.find((s) => s.familyId === parsed.data.familyId);
    if (!target) {
      return NextResponse.json(
        { ok: false, message: "Sessão não encontrada." },
        { status: 404 },
      );
    }

    await revokeUserSessionFamily(session.userId, parsed.data.familyId);
    await logUserSecurityEvent(session.userId, "SESSION_REVOKED", {
      metadata: { familyId: parsed.data.familyId },
    });

    const res = NextResponse.json({
      ok: true,
      signedOut: target.current,
      sessions: await listActiveUserSessions(session.userId, null),
    });

    if (target.current) {
      clearAuthCookies(res);
    }

    return res;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Não foi possível revogar a sessão." },
      { status: 500 },
    );
  }
}
