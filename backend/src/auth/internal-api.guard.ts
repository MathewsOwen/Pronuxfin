import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';

/**
 * Ensures auth endpoints are only reachable through the trusted Next.js BFF.
 *
 * The BFF carries every protection (distributed rate limiting, anti-enumeration,
 * cookie handling). If the backend is publicly reachable, an attacker could hit
 * `/auth/*` directly and skip all of it. We require a shared secret header that
 * only the BFF knows.
 *
 * When `INTERNAL_API_SECRET` is unset (local dev / tests) the guard allows the
 * request so nothing breaks out of the box.
 */
@Injectable()
export class InternalApiGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const secret = this.config.get<string>('INTERNAL_API_SECRET')?.trim();
    if (!secret) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.headers['x-internal-auth'];
    const provided = Array.isArray(header) ? header[0] : header;
    if (typeof provided !== 'string' || provided.length === 0) {
      throw new UnauthorizedException();
    }

    const a = Buffer.from(provided);
    const b = Buffer.from(secret);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
