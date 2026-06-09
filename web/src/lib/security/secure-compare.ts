/** Constant-time string compare — Edge, browser and Node (no node:crypto). */
function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}

/** Compares secrets without leaking length/timing hints beyond equality. */
export function secureCompareStrings(a: string, b: string): boolean {
  const enc = new TextEncoder();
  return timingSafeEqualBytes(enc.encode(a), enc.encode(b));
}

/** True when request carries the configured BFF shared secret. */
export function isInternalApiProbe(req: Request): boolean {
  const secret = process.env.INTERNAL_API_SECRET?.trim();
  if (!secret || secret.length < 32) return false;
  const provided = req.headers.get("x-internal-auth")?.trim();
  if (!provided) return false;
  return secureCompareStrings(provided, secret);
}
