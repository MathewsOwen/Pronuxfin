/**
 * Shared secret header proving a backend request came from the trusted BFF.
 * Empty (no-op) when INTERNAL_API_SECRET is unset in local dev.
 */
export function internalApiHeaders(): Record<string, string> {
  const secret = process.env.INTERNAL_API_SECRET?.trim();
  return secret ? { "x-internal-auth": secret } : {};
}

export function isInternalApiSecretConfigured(): boolean {
  return (process.env.INTERNAL_API_SECRET?.trim().length ?? 0) >= 32;
}
