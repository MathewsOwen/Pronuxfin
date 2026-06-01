import type { NextResponse } from "next/server";

import { secureAuthCookie } from "@/lib/auth/cookie-settings";
import {
  CSRF_COOKIE_NAME,
  generateCsrfToken,
} from "@/lib/security/csrf-constants";

const CSRF_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export function csrfCookieOptions(maxAge = CSRF_MAX_AGE_SEC) {
  return {
    httpOnly: false as const,
    secure: secureAuthCookie(),
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function setCsrfCookie(res: NextResponse, token?: string): string {
  const value = token ?? generateCsrfToken();
  res.cookies.set(CSRF_COOKIE_NAME, value, csrfCookieOptions());
  return value;
}

export function clearCsrfCookie(res: NextResponse): void {
  res.cookies.set(CSRF_COOKIE_NAME, "", { ...csrfCookieOptions(0), maxAge: 0 });
}
