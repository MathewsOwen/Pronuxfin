import { createHmac, timingSafeEqual } from 'crypto';
import type { Request } from 'express';

export const INTERNAL_TIMESTAMP_HEADER = 'x-internal-timestamp';
export const INTERNAL_SIGNATURE_HEADER = 'x-internal-signature';
export const INTERNAL_BODY_SHA256_HEADER = 'x-internal-body-sha256';

const DEFAULT_SKEW_SEC = 120;

function signingSkewSec(): number {
  const raw = Number(process.env.INTERNAL_API_SIGNATURE_SKEW_SEC);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_SKEW_SEC;
}

export function isInternalApiSigningEnforced(): boolean {
  if (process.env.INTERNAL_API_REQUEST_SIGNING === '0') return false;
  if (process.env.INTERNAL_API_REQUEST_SIGNING === '1') return true;
  return process.env.NODE_ENV === 'production';
}

function headerValue(req: Request, name: string): string | null {
  const raw = req.headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0]?.trim() || null;
  return typeof raw === 'string' ? raw.trim() : null;
}

function buildPayload(
  timestampSec: number,
  method: string,
  path: string,
  bodySha256: string,
): string {
  return [String(timestampSec), method.toUpperCase(), path, bodySha256].join(
    '\n',
  );
}

function safeEqualStrings(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function verifyInternalApiSignature(
  req: Request,
  secret: string,
): { ok: true } | { ok: false; reason: string } {
  const timestampRaw = headerValue(req, INTERNAL_TIMESTAMP_HEADER);
  const signature = headerValue(req, INTERNAL_SIGNATURE_HEADER);
  const bodySha256 = headerValue(req, INTERNAL_BODY_SHA256_HEADER) ?? '';

  if (!timestampRaw || !signature) {
    return { ok: false, reason: 'missing_signature' };
  }

  const timestampSec = Number.parseInt(timestampRaw, 10);
  if (!Number.isFinite(timestampSec)) {
    return { ok: false, reason: 'invalid_timestamp' };
  }

  const skew = signingSkewSec();
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestampSec) > skew) {
    return { ok: false, reason: 'timestamp_skew' };
  }

  const path = req.path || req.url.split('?')[0] || '/';
  const payload = buildPayload(timestampSec, req.method, path, bodySha256);
  const expected = createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('base64url');

  if (!safeEqualStrings(signature, expected)) {
    return { ok: false, reason: 'invalid_signature' };
  }

  return { ok: true };
}
