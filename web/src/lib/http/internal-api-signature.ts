import { createHash, createHmac } from "node:crypto";

export const INTERNAL_TIMESTAMP_HEADER = "x-internal-timestamp";
export const INTERNAL_SIGNATURE_HEADER = "x-internal-signature";
export const INTERNAL_BODY_SHA256_HEADER = "x-internal-body-sha256";

const DEFAULT_SKEW_SEC = 120;

function signingSkewSec(): number {
  const raw = Number(process.env.INTERNAL_API_SIGNATURE_SKEW_SEC);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_SKEW_SEC;
}

export function isInternalApiSigningEnforced(): boolean {
  if (process.env.INTERNAL_API_REQUEST_SIGNING === "0") return false;
  if (process.env.INTERNAL_API_REQUEST_SIGNING === "1") return true;
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

export function hashInternalRequestBody(body?: string): string {
  return createHash("sha256")
    .update(body ?? "", "utf8")
    .digest("hex");
}

export function buildInternalApiSignaturePayload(opts: {
  timestampSec: number;
  method: string;
  path: string;
  bodySha256: string;
}): string {
  return [
    String(opts.timestampSec),
    opts.method.toUpperCase(),
    opts.path,
    opts.bodySha256,
  ].join("\n");
}

/** HMAC-SHA256 request signing — prevents replay and secret leakage via logs. */
export function signInternalApiRequest(opts: {
  method: string;
  path: string;
  body?: string;
  secret: string;
}): Record<string, string> {
  const normalizedPath = opts.path.startsWith("/") ? opts.path : `/${opts.path}`;
  const timestampSec = Math.floor(Date.now() / 1000);
  const bodySha256 = hashInternalRequestBody(opts.body);
  const payload = buildInternalApiSignaturePayload({
    timestampSec,
    method: opts.method,
    path: normalizedPath,
    bodySha256,
  });
  const signature = createHmac("sha256", opts.secret)
    .update(payload, "utf8")
    .digest("base64url");

  return {
    [INTERNAL_TIMESTAMP_HEADER]: String(timestampSec),
    [INTERNAL_BODY_SHA256_HEADER]: bodySha256,
    [INTERNAL_SIGNATURE_HEADER]: signature,
  };
}

export { signingSkewSec };
