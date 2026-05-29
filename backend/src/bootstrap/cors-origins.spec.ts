import { resolveCorsOrigins } from './cors-origins';

describe('resolveCorsOrigins', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.FRONTEND_URL;
    delete process.env.FRONTEND_URLS;
  });

  afterAll(() => {
    process.env = env;
  });

  it('defaults to localhost and 127.0.0.1 when unset', () => {
    expect(resolveCorsOrigins()).toEqual([
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]);
  });

  it('merges FRONTEND_URL and FRONTEND_URLS', () => {
    process.env.FRONTEND_URL = 'https://www.pronuxfin.com.br';
    process.env.FRONTEND_URLS =
      'https://pronuxfin.com.br, https://pronuxfin.vercel.app';
    const origins = resolveCorsOrigins();
    expect(origins).toContain('https://www.pronuxfin.com.br');
    expect(origins).toContain('https://pronuxfin.com.br');
    expect(origins).toContain('https://pronuxfin.vercel.app');
    expect(origins).toHaveLength(3);
  });
});
