import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';

/** True when the caller presents the shared BFF secret (timing-safe). */
export function isInternalApiProbe(req: Request): boolean {
  const secret = process.env.INTERNAL_API_SECRET?.trim();
  if (!secret || secret.length < 32) return false;

  const header = req.headers['x-internal-auth'];
  const provided = Array.isArray(header) ? header[0] : header;
  if (typeof provided !== 'string' || provided.length === 0) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
