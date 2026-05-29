import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function logUserSecurityEvent(
  userId: string,
  eventType: string,
  meta: { ip?: string | null; userAgent?: string | null; metadata?: Record<string, unknown> } = {},
): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        userId,
        eventType,
        ip: meta.ip?.slice(0, 64) ?? null,
        userAgent: meta.userAgent?.slice(0, 256) ?? null,
        metadata: meta.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch {
    /* non-blocking */
  }
}
