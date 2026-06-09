import {
  isInternalApiSigningEnforced,
  signInternalApiRequest,
} from "@/lib/http/internal-api-signature";

export type InternalApiHeaderOptions = {
  method: string;
  path: string;
  body?: string;
};

/**
 * Proves a backend request came from the trusted BFF.
 * Production: HMAC signature (no raw secret on the wire).
 * Dev: static header fallback when signing is off.
 */
export function internalApiHeaders(
  opts?: InternalApiHeaderOptions,
): Record<string, string> {
  const secret = process.env.INTERNAL_API_SECRET?.trim();
  if (!secret) return {};

  if (isInternalApiSigningEnforced() && opts) {
    return signInternalApiRequest({
      method: opts.method,
      path: opts.path,
      body: opts.body,
      secret,
    });
  }

  return { "x-internal-auth": secret };
}

export function isInternalApiSecretConfigured(): boolean {
  return (process.env.INTERNAL_API_SECRET?.trim().length ?? 0) >= 32;
}
