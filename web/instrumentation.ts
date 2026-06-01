/**
 * Runs once when the Node.js runtime boots (server / route handlers).
 * Fails fast in production when critical security env is missing or disabled.
 */
export async function register() {
  // Playwright E2E boots `next start` without a full production stack (no Postgres).
  if (process.env.PLAYWRIGHT_E2E === "1") return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertProductionSecurityEnv } = await import(
      "@/lib/security/production-security"
    );
    assertProductionSecurityEnv();
  }
}
