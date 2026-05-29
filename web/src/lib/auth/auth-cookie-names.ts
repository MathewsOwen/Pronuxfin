import { secureAuthCookie } from "@/lib/auth/cookie-settings";

/** Host-only access cookie (requires Secure + Path=/). */
export const AUTH_COOKIE = "__Host-pronuxfin_at";

/** Secure refresh cookie scoped to /api/auth (cannot use __Host- with a subpath). */
export const REFRESH_COOKIE = "__Secure-pronuxfin_rt";

/** Pre-hardening names — still read during rollout. */
export const LEGACY_AUTH_COOKIE = "pronuxfin_token";
export const LEGACY_REFRESH_COOKIE = "pronuxfin_refresh";

export const REFRESH_COOKIE_PATH = "/api/auth";

export function activeAuthCookieName(): string {
  return secureAuthCookie() ? AUTH_COOKIE : LEGACY_AUTH_COOKIE;
}

export function activeRefreshCookieName(): string {
  return secureAuthCookie() ? REFRESH_COOKIE : LEGACY_REFRESH_COOKIE;
}

type CookieGetter = {
  get: (name: string) => { value?: string } | undefined;
};

export function readAuthCookieValue(jar: CookieGetter): string | undefined {
  const primary = activeAuthCookieName();
  return (
    jar.get(primary)?.value ??
    jar.get(AUTH_COOKIE)?.value ??
    jar.get(LEGACY_AUTH_COOKIE)?.value
  );
}

export function readRefreshCookieValue(jar: CookieGetter): string | undefined {
  const primary = activeRefreshCookieName();
  return (
    jar.get(primary)?.value ??
    jar.get(REFRESH_COOKIE)?.value ??
    jar.get(LEGACY_REFRESH_COOKIE)?.value
  );
}

export const AUTH_COOKIES_TO_CLEAR = [
  AUTH_COOKIE,
  LEGACY_AUTH_COOKIE,
  REFRESH_COOKIE,
  LEGACY_REFRESH_COOKIE,
] as const;
