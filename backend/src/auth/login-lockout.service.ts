import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityEventService } from './security-event.service';
import type { TokenMeta } from './refresh-token.service';

function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

@Injectable()
export class LoginLockoutService {
  private readonly maxAttempts = envInt('AUTH_LOCKOUT_MAX_ATTEMPTS', 8);
  private readonly windowMs = envInt('AUTH_LOCKOUT_WINDOW_MS', 15 * 60_000);
  private readonly lockMs = envInt('AUTH_LOCKOUT_DURATION_MS', 30 * 60_000);

  constructor(
    private readonly prisma: PrismaService,
    private readonly securityEvents: SecurityEventService,
  ) {}

  private windowStart(): Date {
    return new Date(Date.now() - this.windowMs);
  }

  private lockStart(): Date {
    return new Date(Date.now() - this.lockMs);
  }

  async assertLoginAllowed(
    email: string,
    userId: string | null,
    meta?: TokenMeta,
  ): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const ip = meta?.ip?.trim() || null;

    if (userId) {
      const recentLock = await this.prisma.securityEvent.findFirst({
        where: {
          userId,
          eventType: 'ACCOUNT_LOCKOUT',
          createdAt: { gte: this.lockStart() },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (recentLock) {
        throw this.lockedException();
      }

      const failures = await this.prisma.securityEvent.count({
        where: {
          userId,
          eventType: 'LOGIN_FAILED',
          createdAt: { gte: this.windowStart() },
        },
      });
      if (failures >= this.maxAttempts) {
        await this.securityEvents.record('ACCOUNT_LOCKOUT', userId, {
          ...meta,
          metadata: { email: normalizedEmail },
        });
        throw this.lockedException();
      }
      return;
    }

    if (!ip) return;

    const ipFailures = await this.prisma.securityEvent.count({
      where: {
        userId: null,
        eventType: 'LOGIN_FAILED',
        ip,
        createdAt: { gte: this.windowStart() },
      },
    });
    if (ipFailures >= this.maxAttempts * 2) {
      throw this.lockedException();
    }
  }

  private lockedException(): HttpException {
    return new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many failed sign-in attempts. Try again later.',
        code: 'AUTH_ACCOUNT_LOCKED',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
