import * as Sentry from "@sentry/nextjs";

export async function register() {
  // Playwright E2E boots `next start` without a full production stack (no Postgres).
  if (process.env.PLAYWRIGHT_E2E === "1") return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");

    const { assertProductionSecurityEnv } = await import(
      "@/lib/security/production-security"
    );
    assertProductionSecurityEnv();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
