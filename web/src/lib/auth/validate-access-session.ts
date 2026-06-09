import { verifyAccessJwt } from "@/lib/auth/jwt-crypto";
import { isSessionVersionCheckEnabled } from "@/lib/auth/session-version-check";
import { internalApiHeaders } from "@/lib/http/internal-api-headers";
import { readTrimmedEnv } from "@/lib/env/server-env";
import { prisma } from "@/lib/prisma";

export type ValidatedSession = {
  userId: string;
  email?: string;
  tokenVersion: number;
};

async function tokenVersionMatches(userId: string, jwtVer: number): Promise<boolean> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokenVersion: true },
  });
  return !!row && row.tokenVersion === jwtVer;
}

/** Authoritative session check via upstream `/auth/me` (edge-safe, no Prisma). */
export async function confirmSessionViaUpstream(
  accessToken: string,
): Promise<ValidatedSession | null> {
  const apiUrl = readTrimmedEnv("API_URL").replace(/\/+$/, "");
  if (!apiUrl) return null;

  try {
    const res = await fetch(`${apiUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...internalApiHeaders({ method: "GET", path: "/auth/me" }),
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { id?: string; email?: string };
    if (typeof data.id !== "string" || !data.id) return null;
    return { userId: data.id, email: data.email, tokenVersion: 0 };
  } catch {
    return null;
  }
}

/** Validates JWT signature + optional DB tokenVersion (Node.js routes). */
export async function validateAccessToken(
  accessToken: string | null | undefined,
): Promise<ValidatedSession | null> {
  if (!accessToken?.trim()) return null;

  const payload = await verifyAccessJwt(accessToken);
  if (!payload) return null;

  const sub = payload.sub;
  if (typeof sub !== "string" || !sub) return null;

  const jwtVer =
    typeof payload.ver === "number" && Number.isFinite(payload.ver) ?
      Math.floor(payload.ver)
    : 0;

  if (isSessionVersionCheckEnabled()) {
    const ok = await tokenVersionMatches(sub, jwtVer);
    if (!ok) return null;
  }

  const email =
    typeof payload.email === "string" && payload.email ? payload.email : undefined;

  return { userId: sub, email, tokenVersion: jwtVer };
}
