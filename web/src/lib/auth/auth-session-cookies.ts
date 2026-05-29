import type { NextResponse } from "next/server";

import {
  activeAuthCookieName,
  activeRefreshCookieName,
  AUTH_COOKIES_TO_CLEAR,
  LEGACY_REFRESH_COOKIE,
  REFRESH_COOKIE,
} from "@/lib/auth/auth-cookie-names";
import { clearCsrfCookie, setCsrfCookie } from "@/lib/auth/csrf-cookie";
import {
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth/cookie-settings";
import { readPositiveIntEnv } from "@/lib/env/numeric-env";

type UpstreamTokens = {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_in?: unknown;
  refresh_expires_in?: unknown;
};

const DEFAULT_REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Writes the access + refresh cookies from an upstream auth response.
 * Returns false when the response lacks a usable access token.
 */
export function applyAuthCookies(
  res: NextResponse,
  data: UpstreamTokens,
): boolean {
  const access =
    typeof data.access_token === "string" ? data.access_token : null;
  if (!access) return false;

  const accessMaxAge =
    typeof data.expires_in === "number" && data.expires_in > 0
      ? data.expires_in
      : readPositiveIntEnv("JWT_COOKIE_MAX_AGE", 3600);
  res.cookies.set(
    activeAuthCookieName(),
    access,
    accessCookieOptions(accessMaxAge),
  );

  const refresh =
    typeof data.refresh_token === "string" ? data.refresh_token : null;
  if (refresh) {
    const refreshMaxAge =
      typeof data.refresh_expires_in === "number" && data.refresh_expires_in > 0
        ? data.refresh_expires_in
        : readPositiveIntEnv("REFRESH_COOKIE_MAX_AGE", DEFAULT_REFRESH_MAX_AGE);
    res.cookies.set(
      activeRefreshCookieName(),
      refresh,
      refreshCookieOptions(refreshMaxAge),
    );
  }

  setCsrfCookie(res);
  return true;
}

const REFRESH_COOKIE_NAMES = new Set<string>([
  REFRESH_COOKIE,
  LEGACY_REFRESH_COOKIE,
]);

/** Clears active + legacy auth cookies (logout / failed refresh). */
export function clearAuthCookies(res: NextResponse): void {
  clearCsrfCookie(res);
  for (const name of AUTH_COOKIES_TO_CLEAR) {
    const opts = REFRESH_COOKIE_NAMES.has(name)
      ? refreshCookieOptions(0)
      : accessCookieOptions(0);
    res.cookies.set(name, "", opts);
  }
}
