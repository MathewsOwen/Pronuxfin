import { createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";

export type UserSessionView = {
  familyId: string;
  createdAt: string;
  expiresAt: string;
  userAgent: string | null;
  ip: string | null;
  current: boolean;
};

function hashRefreshToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function parseBrowserLabel(userAgent: string | null): string | null {
  if (!userAgent) return null;
  if (/Edg\//i.test(userAgent)) return "Edge";
  if (/Chrome\//i.test(userAgent) && !/Edg/i.test(userAgent)) return "Chrome";
  if (/Firefox\//i.test(userAgent)) return "Firefox";
  if (/Safari\//i.test(userAgent) && !/Chrome/i.test(userAgent)) return "Safari";
  return "Browser";
}

export function sessionDeviceParts(session: UserSessionView): {
  browser: string | null;
  ip: string | null;
} {
  return {
    browser: parseBrowserLabel(session.userAgent),
    ip: session.ip,
  };
}

export async function resolveCurrentFamilyId(
  refreshRaw: string | null | undefined,
): Promise<string | null> {
  if (!refreshRaw?.trim()) return null;
  const row = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(refreshRaw.trim()) },
    select: { familyId: true, revokedAt: true, expiresAt: true },
  });
  if (!row || row.revokedAt || row.expiresAt.getTime() <= Date.now()) {
    return null;
  }
  return row.familyId;
}

/** One row per active refresh family (latest non-revoked leaf). */
export async function listActiveUserSessions(
  userId: string,
  currentFamilyId: string | null,
): Promise<UserSessionView[]> {
  const now = new Date();
  const rows = await prisma.refreshToken.findMany({
    where: {
      userId,
      revokedAt: null,
      replacedById: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
    select: {
      familyId: true,
      createdAt: true,
      expiresAt: true,
      userAgent: true,
      ip: true,
    },
  });

  const byFamily = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!byFamily.has(row.familyId)) {
      byFamily.set(row.familyId, row);
    }
  }

  return [...byFamily.values()].map((row) => ({
    familyId: row.familyId,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    userAgent: row.userAgent,
    ip: row.ip,
    current: currentFamilyId === row.familyId,
  }));
}

export async function revokeUserSessionFamily(
  userId: string,
  familyId: string,
): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    }),
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}
