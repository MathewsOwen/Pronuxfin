import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { readRefreshCookieValue } from "@/lib/auth/auth-cookie-names";
import { requireSessionUser } from "@/lib/auth/require-session-user";
import {
  listActiveUserSessions,
  resolveCurrentFamilyId,
} from "@/lib/auth/user-sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  try {
    const jar = await cookies();
    const currentFamilyId = await resolveCurrentFamilyId(
      readRefreshCookieValue(jar),
    );
    const sessions = await listActiveUserSessions(
      session.userId,
      currentFamilyId,
    );
    return NextResponse.json({ ok: true, sessions });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Não foi possível listar sessões." },
      { status: 500 },
    );
  }
}
