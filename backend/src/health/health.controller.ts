import {
  Controller,
  Get,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { AuthMailerService } from '../auth/auth-mailer.service';
import { PublicRoute } from '../auth/internal-api.guard';
import { isInternalApiProbe } from '../common/internal-probe.util';
import { PrismaService } from '../prisma/prisma.service';
const SERVICE = 'pronuxfin-api';

@PublicRoute()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mailer: AuthMailerService,
  ) {}

  /**
   * Visão geral operacional (sem consultar a DB — barato para dashboards manuais).
   * Probes de orquestração devem usar `/health/live` e `/health/ready`.
   */
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get()
  summary(@Req() req: Request) {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && !isInternalApiProbe(req)) {
      return {
        ok: true as const,
        service: SERVICE,
        check: 'summary' as const,
      };
    }

    const passwordReset = this.mailer.getPasswordResetDeliveryStatus();
    const frontendUrl = this.config.get<string>('FRONTEND_URL')?.trim() ?? '';

    return {
      ok: true as const,
      service: SERVICE,
      uptime_sec: Math.floor(process.uptime()),
      env: process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development',
      endpoints: {
        live: '/health/live',
        ready: '/health/ready',
      },
      capabilities: {
        password_reset: passwordReset.available,
        password_reset_mode: passwordReset.mode,
        frontend_url_configured: frontendUrl.length > 0,
      },
    };
  }

  /** Liveness: o processo responde — adequado a `livenessProbe` / balanceadores “ping”. */
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @Get('live')
  live() {
    return {
      ok: true as const,
      service: SERVICE,
      check: 'live' as const,
      uptime_sec: Math.floor(process.uptime()),
    };
  }

  /** Readiness: Postgres acessível via Prisma — adequado a `readinessProbe` e deploys. */
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Get('ready')
  async ready(@Req() req: Request) {
    const isProd = process.env.NODE_ENV === 'production';
    const internal = isInternalApiProbe(req);

    try {
      await this.prisma.$queryRaw(Prisma.sql`SELECT 1`);
      if (isProd && !internal) {
        return {
          ok: true as const,
          service: SERVICE,
          check: 'ready' as const,
        };
      }
      return {
        ok: true as const,
        service: SERVICE,
        check: 'ready' as const,
        database: 'up' as const,
      };
    } catch {
      if (isProd && !internal) {
        throw new ServiceUnavailableException({
          ok: false,
          service: SERVICE,
          check: 'ready',
        });
      }
      throw new ServiceUnavailableException({
        ok: false,
        service: SERVICE,
        check: 'ready',
        database: 'down',
      });
    }
  }
}
