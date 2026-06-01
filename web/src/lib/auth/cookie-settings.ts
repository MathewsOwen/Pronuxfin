import { REFRESH_COOKIE_PATH } from "@/lib/auth/auth-cookie-names";

/** Cookie JWT: Secure quando build de produção ou COOKIE_SECURE=true (HTTPS atrás do proxy). */
export function secureAuthCookie(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.COOKIE_SECURE === "true"
  );
}

type SameSitePolicy = "lax" | "strict";

type CookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: SameSitePolicy;
  path: string;
  maxAge: number;
};

function refreshSameSite(): SameSitePolicy {
  const lax = process.env.COOKIE_SAMESITE_LAX?.trim().toLowerCase();
  if (lax === "1" || lax === "true") return "lax";

  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";
  if (isProd) return "strict";

  const raw = process.env.COOKIE_SAMESITE_STRICT?.trim().toLowerCase();
  if (raw === "1" || raw === "true" || raw === "yes") return "strict";
  return "lax";
}

function accessSameSite(): SameSitePolicy {
  return refreshSameSite();
}

/** Short-lived access token cookie — readable site-wide for SSR/middleware. */
export function accessCookieOptions(maxAge: number): CookieOptions {
  const secure = secureAuthCookie();
  return {
    httpOnly: true,
    secure,
    sameSite: accessSameSite(),
    path: "/",
    maxAge,
  };
}

/** Long-lived refresh cookie — restricted to the auth routes. */
export function refreshCookieOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    secure: secureAuthCookie(),
    sameSite: refreshSameSite(),
    path: REFRESH_COOKIE_PATH,
    maxAge,
  };
}
