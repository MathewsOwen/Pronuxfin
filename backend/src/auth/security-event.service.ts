import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { SecurityEventType } from './security-event.types';

export type SecurityEventMeta = {
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class SecurityEventService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    eventType: SecurityEventType,
    userId: string | null,
    meta: SecurityEventMeta = {},
  ): Promise<void> {
    try {
      await this.prisma.securityEvent.create({
        data: {
          userId,
          eventType,
          ip: meta.ip?.slice(0, 64) ?? null,
          userAgent: meta.userAgent?.slice(0, 256) ?? null,
          metadata: meta.metadata
            ? (meta.metadata as Prisma.InputJsonValue)
            : undefined,
        },
      });
    } catch {
      /* audit must not break auth flows */
    }
  }

  async hadRecentLoginFromDevice(
    userId: string,
    ip: string | null,
    userAgent: string | null,
    withinHours = 24,
  ): Promise<boolean> {
    const since = new Date(Date.now() - withinHours * 60 * 60 * 1000);
    const recent = await this.prisma.securityEvent.findFirst({
      where: {
        userId,
        eventType: { in: ['LOGIN_SUCCESS', 'WEBAUTHN_LOGIN_SUCCESS'] },
        createdAt: { gte: since },
        ...(ip ? { ip } : {}),
        ...(userAgent ? { userAgent } : {}),
      },
      select: { id: true },
    });
    return !!recent;
  }
}
