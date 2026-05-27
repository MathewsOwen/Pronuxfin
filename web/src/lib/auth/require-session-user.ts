import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth/session-user";

type RequireSessionResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse<{ ok: false; message: string }> };

export async function requireSessionUser(): Promise<RequireSessionResult> {
  const userId = await getSessionUserId();
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, message: "Sessão necessária." },
        { status: 401 },
      ),
    };
  }
  return { ok: true, userId };
}
