/**
 * Runs once when the Node.js runtime boots (server / route handlers).
 * Fails fast in production when critical security env is missing or disabled.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertProductionSecurityEnv } = await import(
      "@/lib/security/production-security"
    );
    assertProductionSecurityEnv();
  }
}
