import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';
import {
  isInternalApiSigningEnforced,
  verifyInternalApiSignature,
} from '../common/internal-api-signature.util';
import { SecurityEventService } from './security-event.service';

/** Rotas públicas (ex.: `/health/*`) — não exigem assinatura BFF. */
export const IS_PUBLIC_ROUTE_KEY = 'isPublicRoute';
export const PublicRoute = () => SetMetadata(IS_PUBLIC_ROUTE_KEY, true);

@Injectable()
export class InternalApiGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
    private readonly securityEvents: SecurityEventService,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_ROUTE_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (isPublic) return true;

    const secret = this.config.get<string>('INTERNAL_API_SECRET')?.trim();
    const isProd = process.env.NODE_ENV === 'production';

    if (!secret) {
      if (isProd) {
        throw new UnauthorizedException();
      }
      return true;
    }

    const req = ctx.switchToHttp().getRequest<Request>();

    if (isInternalApiSigningEnforced()) {
      const verified = verifyInternalApiSignature(req, secret);
      if (!verified.ok) {
        void this.recordProbeFailure(req, verified.reason);
        throw new UnauthorizedException();
      }
      return true;
    }

    const header = req.headers['x-internal-auth'];
    const provided = Array.isArray(header) ? header[0] : header;
    if (typeof provided !== 'string' || provided.length === 0) {
      void this.recordProbeFailure(req, 'missing_header');
      throw new UnauthorizedException();
    }

    const a = Buffer.from(provided);
    const b = Buffer.from(secret);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      void this.recordProbeFailure(req, 'invalid_secret');
      throw new UnauthorizedException();
    }
    return true;
  }

  private recordProbeFailure(req: Request, reason: string): void {
    void this.securityEvents.record('INTERNAL_API_PROBE_FAILED', null, {
      ip: req.ip ?? null,
      userAgent:
        typeof req.headers['user-agent'] === 'string'
          ? req.headers['user-agent']
          : null,
      metadata: { reason },
    });
  }
}
