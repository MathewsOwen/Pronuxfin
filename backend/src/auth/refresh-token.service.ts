import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { refreshMetaMismatch } from './refresh-bind.util';
import { SecurityEventService } from './security-event.service';

const DEFAULT_REFRESH_TTL_SEC = 60 * 60 * 24 * 30; // 30 days
const DEFAULT_MAX_FAMILIES = 8;

function maxFamiliesPerUser(): number {
  const raw = Number(process.env.MAX_REFRESH_FAMILIES_PER_USER);
  return Number.isFinite(raw) && raw > 0
    ? Math.floor(raw)
    : DEFAULT_MAX_FAMILIES;
}

export type TokenMeta = { userAgent?: string | null; ip?: string | null };

export type IssuedRefreshToken = {
  token: string;
  familyId: string;
  expiresAt: Date;
};

export type RotatedRefreshToken = {
  userId: string;
  token: string;
  familyId: string;
  expiresAt: Date;
};

/**
 * Rotating refresh tokens with theft detection.
 *
 * - Only the SHA-256 hash of the opaque token is stored.
 * - Every refresh rotates the token (old one revoked, linked to its successor).
 * - Presenting an already-rotated/revoked token = reuse → the whole family is
 *   revoked (classic stolen-token signal), forcing a fresh login.
 */
@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly securityEvents: SecurityEventService,
  ) {}

  ttlSec(): number {
    const raw = Number(
      this.config.get('REFRESH_TOKEN_TTL_SEC') ?? DEFAULT_REFRESH_TTL_SEC,
    );
    return Number.isFinite(raw) && raw > 0
      ? Math.floor(raw)
      : DEFAULT_REFRESH_TTL_SEC;
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private newToken(): string {
    return randomBytes(48).toString('base64url');
  }

  private normalizeMeta(meta?: TokenMeta) {
    return {
      userAgent: meta?.userAgent ? meta.userAgent.slice(0, 256) : null,
      ip: meta?.ip ? meta.ip.slice(0, 64) : null,
    };
  }

  async issue(
    userId: string,
    opts: { familyId?: string; meta?: TokenMeta } = {},
  ): Promise<IssuedRefreshToken> {
    if (!opts.familyId) {
      await this.enforceActiveFamilyCap(userId);
    }

    const token = this.newToken();
    const familyId = opts.familyId ?? randomUUID();
    const expiresAt = new Date(Date.now() + this.ttlSec() * 1000);
    const meta = this.normalizeMeta(opts.meta);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hash(token),
        familyId,
        expiresAt,
        userAgent: meta.userAgent,
        ip: meta.ip,
      },
    });

    return { token, familyId, expiresAt };
  }

  async rotate(
    rawToken: string,
    meta?: TokenMeta,
  ): Promise<RotatedRefreshToken | null> {
    const tokenHash = this.hash(rawToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!existing) return null;

    // Reuse detection: a rotated/revoked token reappearing means it may have
    // been stolen. Burn the entire family so neither party keeps access.
    if (existing.revokedAt || existing.replacedById) {
      await this.revokeFamily(existing.familyId);
      await this.securityEvents.record('REFRESH_REUSE', existing.userId, meta);
      return null;
    }
    if (existing.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    if (
      refreshMetaMismatch(
        { userAgent: existing.userAgent, ip: existing.ip },
        meta,
      )
    ) {
      await this.revokeFamily(existing.familyId);
      await this.securityEvents.record(
        'REFRESH_BIND_MISMATCH',
        existing.userId,
        meta,
      );
      return null;
    }

    const next = this.newToken();
    const nextHash = this.hash(next);
    const expiresAt = new Date(Date.now() + this.ttlSec() * 1000);
    const normalized = this.normalizeMeta(meta);

    const created = await this.prisma
      .$transaction(async (tx) => {
        const newToken = await tx.refreshToken.create({
          data: {
            userId: existing.userId,
            tokenHash: nextHash,
            familyId: existing.familyId,
            expiresAt,
            userAgent: normalized.userAgent,
            ip: normalized.ip,
          },
        });
        const rotated = await tx.refreshToken.updateMany({
          where: { id: existing.id, revokedAt: null, replacedById: null },
          data: { revokedAt: new Date(), replacedById: newToken.id },
        });
        if (rotated.count !== 1) {
          throw new Error('REFRESH_RACE');
        }
        return newToken;
      })
      .catch(() => null);

    if (!created) {
      // Lost the rotation race → treat conservatively as reuse.
      await this.revokeFamily(existing.familyId);
      return null;
    }

    return {
      userId: existing.userId,
      token: next,
      familyId: existing.familyId,
      expiresAt,
    };
  }

  async revoke(rawToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hash(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Caps concurrent device sessions — revokes oldest families when over limit. */
  private async enforceActiveFamilyCap(userId: string): Promise<void> {
    const max = maxFamiliesPerUser();
    const active = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { familyId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const families: { familyId: string; createdAt: Date }[] = [];
    const seen = new Set<string>();
    for (const row of active) {
      if (seen.has(row.familyId)) continue;
      seen.add(row.familyId);
      families.push(row);
    }

    if (families.length < max) return;

    const excess = families.length - max + 1;
    for (let i = 0; i < excess; i += 1) {
      await this.revokeFamily(families[i].familyId);
    }
  }
}
