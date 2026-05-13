import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { initE2eApp } from './e2e-app';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await initE2eApp(moduleFixture);
  });

  it('/health (summary)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        const body = res.body as {
          ok?: boolean;
          endpoints?: { live: string; ready: string };
        };
        expect(body.ok).toBe(true);
        expect(res.get('X-Request-Id')).toBeTruthy();
        expect(body.endpoints).toEqual({
          live: '/health/live',
          ready: '/health/ready',
        });
      });
  });

  it('/health/live (GET)', () => {
    return request(app.getHttpServer())
      .get('/health/live')
      .expect(200)
      .expect((res: { body: { ok?: boolean; check?: string } }) => {
        expect(res.body.ok).toBe(true);
        expect(res.body.check).toBe('live');
      });
  });

  it('/health/ready (GET)', () => {
    return request(app.getHttpServer())
      .get('/health/ready')
      .expect(200)
      .expect((res: { body: { ok?: boolean; database?: string } }) => {
        expect(res.body.ok).toBe(true);
        expect(res.body.database).toBe('up');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
