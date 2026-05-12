/**
 * Arranque do SDK Sentry antes de qualquer Nest module (recomendação oficial).
 * Sem `SENTRY_DSN`, `enabled` falso — zero tráfego.
 */
import * as Sentry from '@sentry/nestjs';

const rate = (): number => {
  const raw = process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0';
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
};

const dsn = process.env.SENTRY_DSN?.trim();

Sentry.init({
  enabled: !!dsn,
  dsn: dsn ?? undefined,
  environment: process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development',
  tracesSampleRate: rate(),
});
