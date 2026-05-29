/**
 * Shared secret header proving a backend request came from the trusted BFF.
 * Empty (no-op) when INTERNAL_API_SECRET is unset, so dev works out of the box.
 */
export function internalApiHeaders(): Record<string, string> {
  const secret = process.env.INTERNAL_API_SECRET?.trim();
  return secret ? { "x-internal-auth": secret } : {};
}
