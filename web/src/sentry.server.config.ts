import * as Sentry from "@sentry/nextjs";

function tracesSampleRate(): number {
  const raw = process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0";
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}

const dsn =
  process.env.SENTRY_DSN?.trim() ?? process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

Sentry.init({
  dsn: dsn || undefined,
  enabled: !!dsn,
  environment:
    process.env.NEXT_PUBLIC_APP_ENV ??
    process.env.APP_ENV ??
    process.env.NODE_ENV ??
    "development",
  tracesSampleRate: tracesSampleRate(),
  sendDefaultPii: false,
});
