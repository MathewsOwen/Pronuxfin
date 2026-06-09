import './instrument';

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { AuthModule } from './auth/auth.module';
import { InternalApiGuard } from './auth/internal-api.guard';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SentryModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [
    /** Antes de outros filtros específicos (ex.: throttle) — apenas erros não-HTTP são enviados por defeito (ver docs). */
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    /** Bloqueia `/auth/*` sem segredo BFF; `@PublicRoute()` libera `/health/*`. */
    { provide: APP_GUARD, useClass: InternalApiGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
