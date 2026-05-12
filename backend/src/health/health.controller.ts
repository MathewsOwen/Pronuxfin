import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const SERVICE = 'pronuxfin-api';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Visão geral operacional (sem consultar a DB — barato para dashboards manuais).
   * Probes de orquestração devem usar `/health/live` e `/health/ready`.
   */
  @Get()
  summary() {
    return {
      ok: true as const,
      service: SERVICE,
      uptime_sec: Math.floor(process.uptime()),
      env: process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development',
      endpoints: {
        live: '/health/live',
        ready: '/health/ready',
      },
    };
  }

  /** Liveness: o processo responde — adequado a `livenessProbe` / balanceadores “ping”. */
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
  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw(Prisma.sql`SELECT 1`);
      return {
        ok: true as const,
        service: SERVICE,
        check: 'ready' as const,
        database: 'up' as const,
      };
    } catch {
      throw new ServiceUnavailableException({
        ok: false,
        service: SERVICE,
        check: 'ready',
        database: 'down',
      });
    }
  }
}
