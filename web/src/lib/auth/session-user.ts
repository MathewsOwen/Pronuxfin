import { cookies } from "next/headers";

import { readAuthCookieValue } from "@/lib/auth/auth-cookie-names";
import { verifyAccessJwt } from "@/lib/auth/jwt-crypto";
import { isSessionVersionCheckEnabled } from "@/lib/auth/session-version-check";
import { prisma } from "@/lib/prisma";

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = readAuthCookieValue(jar);
  if (!token) return null;
  const payload = await verifyAccessJwt(token);
  if (!payload) return null;
  const sub = payload.sub;
  if (typeof sub !== "string" || sub.length === 0) return null;

  if (isSessionVersionCheckEnabled()) {
    const jwtVer =
      typeof payload.ver === "number" && Number.isFinite(payload.ver) ?
        Math.floor(payload.ver)
      : 0;
    const row = await prisma.user.findUnique({
      where: { id: sub },
      select: { tokenVersion: true },
    });
    if (!row || row.tokenVersion !== jwtVer) return null;
  }

  return sub;
}
