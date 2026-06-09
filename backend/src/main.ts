import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { assertProductionSecurityConfig } from './bootstrap/assert-production-security';
import { logProductionWarnings } from './bootstrap/log-production-warnings';
import { resolveCorsOrigins } from './bootstrap/cors-origins';
import { ThrottlerExceptionPtFilter } from './common/filters/throttler-pt.filter';
import { createAppValidationPipe } from './common/validation/validation-pipe.factory';

async function bootstrap() {
  assertProductionSecurityConfig();
  logProductionWarnings();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const trustProxyHop = Number.parseInt(process.env.TRUST_PROXY ?? '0', 10);
  app.set(
    'trust proxy',
    Number.isFinite(trustProxyHop) && trustProxyHop >= 0 ? trustProxyHop : 0,
  );
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      hsts:
        process.env.NODE_ENV === 'production'
          ? {
              maxAge: 63_072_000,
              includeSubDomains: true,
              preload: true,
            }
          : false,
    }),
  );
  app.useGlobalFilters(new ThrottlerExceptionPtFilter());
  app.useGlobalPipes(createAppValidationPipe());
  const corsOrigins = resolveCorsOrigins();
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
  const port = Number(process.env.PORT ?? 4000);
  const http = app.getHttpAdapter().getInstance() as {
    disable?: (name: string) => void;
  };
  http.disable?.('x-powered-by');
  // Render/Docker fazem health-check na porta $PORT; precisa escutar em todas as interfaces.
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
