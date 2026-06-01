/** Edge-safe CSRF identifiers (no Node-only imports). */

export const CSRF_COOKIE_NAME = "pronuxfin_csrf";
export const CSRF_HEADER = "x-csrf-token";

export function generateCsrfToken(): string {
  return crypto.randomUUID();
}
