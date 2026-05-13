import { type INestApplication } from '@nestjs/common';
import { type TestingModule } from '@nestjs/testing';
import { type App } from 'supertest/types';
import { ThrottlerExceptionPtFilter } from '../src/common/filters/throttler-pt.filter';
import { createAppValidationPipe } from '../src/common/validation/validation-pipe.factory';

/** Espelha `main.ts` para e2e: validação + respostas 429 com `code` esperado pelos testes. */
export async function initE2eApp(
  moduleFixture: TestingModule,
): Promise<INestApplication<App>> {
  const app = moduleFixture.createNestApplication();
  app.useGlobalFilters(new ThrottlerExceptionPtFilter());
  app.useGlobalPipes(createAppValidationPipe());
  await app.init();
  return app;
}
