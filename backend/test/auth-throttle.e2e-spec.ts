import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { initE2eApp } from './e2e-app';

/**
 * Cobre `@Throttle` no AuthController sem depender de credenciais válidas:
 * primeiro passa pela guarda → depois a validação retorna 400.
 */
describe('Auth throttling (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await initE2eApp(moduleFixture);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health continua acessível', () => {
    return request(app.getHttpServer()).get('/health').expect(HttpStatus.OK);
  });

  it('POST /auth/login retorna 429 após o limite no intervalo', async () => {
    const server = app.getHttpServer();
    const body = { email: 'nao-e-email', password: 'x' };

    for (let i = 0; i < 25; i++) {
      await request(server)
        .post('/auth/login')
        .send(body)
        .expect(HttpStatus.BAD_REQUEST);
    }

    const res = await request(server).post('/auth/login').send(body);
    expect(res.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    const payload = res.body as { message?: string; code?: string };
    expect(payload.code).toBe('AUTH_RATE_LIMIT_LOGIN');
    expect(typeof payload.message).toBe('string');
  });

  it('POST /auth/register retorna 429 após o limite no intervalo', async () => {
    const server = app.getHttpServer();
    const body = { email: 'invalido', password: '12345678' };

    for (let i = 0; i < 15; i++) {
      await request(server)
        .post('/auth/register')
        .send(body)
        .expect(HttpStatus.BAD_REQUEST);
    }

    const res = await request(server).post('/auth/register').send(body);
    expect(res.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    const payload = res.body as { message?: string; code?: string };
    expect(payload.code).toBe('AUTH_RATE_LIMIT_REGISTER');
    expect(typeof payload.message).toBe('string');
  });

  it('POST /auth/forgot-password retorna 429 após o limite no intervalo', async () => {
    const server = app.getHttpServer();
    const body = { email: 'invalido' };

    for (let i = 0; i < 8; i++) {
      await request(server)
        .post('/auth/forgot-password')
        .send(body)
        .expect(HttpStatus.BAD_REQUEST);
    }

    const res = await request(server).post('/auth/forgot-password').send(body);
    expect(res.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    const payload = res.body as { message?: string; code?: string };
    expect(payload.code).toBe('AUTH_RATE_LIMIT_FORGOT_PASSWORD');
    expect(typeof payload.message).toBe('string');
  });

  it('POST /auth/reset-password retorna 429 após o limite no intervalo', async () => {
    const server = app.getHttpServer();
    const body = { token: '', password: '12345678' };

    for (let i = 0; i < 12; i++) {
      await request(server)
        .post('/auth/reset-password')
        .send(body)
        .expect(HttpStatus.BAD_REQUEST);
    }

    const res = await request(server).post('/auth/reset-password').send(body);
    expect(res.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    const payload = res.body as { message?: string; code?: string };
    expect(payload.code).toBe('AUTH_RATE_LIMIT_RESET_PASSWORD');
    expect(typeof payload.message).toBe('string');
  });
});
