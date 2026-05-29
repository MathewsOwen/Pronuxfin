import { timingSafeEqual } from "node:crypto";

export const CSRF_COOKIE_NAME = "pronuxfin_csrf";
export const CSRF_HEADER = "x-csrf-token";

export function isCsrfEnforced(): boolean {
  if (process.env.CSRF_ENFORCE === "0") return false;
  if (process.env.NODE_ENV === "test") return false;
  return true;
}

export function generateCsrfToken(): string {
  return crypto.randomUUID();
}

export function parseCookieValue(
  cookieHeader: string | null,
  name: string,
): string | null {
  if (!cookieHeader) return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`),
  );
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1].trim());
  } catch {
    return match[1].trim();
  }
}

function bytesEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ba = enc.encode(a);
  const bb = enc.encode(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function csrfTokensMatch(header: string | null, cookie: string | null): boolean {
  const h = header?.trim();
  const c = cookie?.trim();
  if (!h || !c || h.length < 16 || c.length < 16) return false;
  return bytesEqual(h, c);
}

/** Browsers send `cross-site` on forged form posts from other origins. */
export function isAcceptableSecFetchSite(req: Request): boolean {
  const value = req.headers.get("sec-fetch-site")?.trim().toLowerCase();
  if (!value) return true;
  return value === "same-origin" || value === "same-site";
}

export function isAcceptableAuthEntryOrigin(req: Request): boolean {
  const host = req.headers.get("host")?.trim();
  if (!host) return false;

  const origin = req.headers.get("origin")?.trim();
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  const referer = req.headers.get("referer")?.trim();
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  return isAcceptableSecFetchSite(req);
}
