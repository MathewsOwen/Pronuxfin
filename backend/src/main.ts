import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ThrottlerExceptionPtFilter } from './common/filters/throttler-pt.filter';
import { createAppValidationPipe } from './common/validation/validation-pipe.factory';

async function bootstrap() {
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
    }),
  );
  app.useGlobalFilters(new ThrottlerExceptionPtFilter());
  app.useGlobalPipes(createAppValidationPipe());
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}
void bootstrap();
