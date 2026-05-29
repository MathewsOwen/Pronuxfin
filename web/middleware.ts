import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import {
  readAuthCookieValue,
  readRefreshCookieValue,
} from "@/lib/auth/auth-cookie-names";
import { verifyAccessJwt } from "@/lib/auth/jwt-crypto";
import { isJwtSecretConfigured } from "@/lib/env/server-env";
import {
  buildContentSecurityPolicy,
  cspHeaderName,
  resolveCspMode,
} from "@/lib/security/csp";
import { setCsrfCookie } from "@/lib/auth/csrf-cookie";
import { CSRF_COOKIE_NAME } from "@/lib/security/csrf";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

function newPageNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

function finishPageResponse(
  response: NextResponse,
  rid: string,
  nonce: string,
  request?: NextRequest,
): NextResponse {
  response.headers.set("x-request-id", rid);
  const mode = resolveCspMode();
  const headerName = cspHeaderName(mode);
  if (headerName) {
    const value = buildContentSecurityPolicy({
      nonce,
      isProd: process.env.NODE_ENV === "production",
    });
    response.headers.set(headerName, value);
  }
  if (!request?.cookies.get(CSRF_COOKIE_NAME)?.value) {
    setCsrfCookie(response);
  }
  return response;
}

function pathnameHasLocale(pathname: string): boolean {
  return routing.locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
}

function toInternalLocalePath(pathname: string): string {
  if (pathnameHasLocale(pathname)) return pathname;
  if (pathname === "/") return `/${routing.defaultLocale}`;
  return `/${routing.defaultLocale}${pathname}`;
}

const protectedPrefixes = [
  "/dashboard",
  "/assistant",
  "/education",
  "/compare",
  "/alerts",
  "/ativo",
  "/carteira",
  "/calendario",
  "/rota",
  "/perfil",
];

export async function middleware(request: NextRequest) {
  const existing = request.headers.get("x-request-id")?.trim();
  const rid = existing || crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", rid);

  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith("/api")) {
    requestHeaders.set("x-middleware-pathname", pathname);
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.next({
      request: { headers: requestHeaders },
      headers: { "x-request-id": rid },
    });
  }

  const nonce = newPageNonce();
  requestHeaders.set("x-nonce", nonce);

  const isProtected = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  const authEntryPaths = ["/login", "/register"];
  const isAuthEntry = authEntryPaths.includes(pathname);

  if (isProtected || isAuthEntry) {
    if (!isJwtSecretConfigured()) {
      console.error("JWT_SECRET ausente ou curto no frontend");
      if (isAuthEntry) {
        const res = await Promise.resolve(
          intlMiddleware(new NextRequest(request, { headers: requestHeaders })),
        );
        return finishPageResponse(res, rid, nonce, request);
      }
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("from", pathname);
      const res = NextResponse.redirect(url);
      return finishPageResponse(res, rid, nonce, request);
    }

    const token = readAuthCookieValue(request.cookies);
    const refreshToken = readRefreshCookieValue(request.cookies);

    // When the (short-lived) access token is gone/expired but a refresh token
    // is present, bounce through the silent refresh route instead of forcing
    // a re-login. /api is outside this middleware, so there is no loop.
    const refreshRedirect = () => {
      const url = request.nextUrl.clone();
      url.pathname = "/api/auth/refresh";
      url.search = `?from=${encodeURIComponent(pathname)}`;
      const res = NextResponse.redirect(url);
      return finishPageResponse(res, rid, nonce, request);
    };

    if (isAuthEntry && token) {
      const payload = await verifyAccessJwt(token);
      if (payload) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        url.search = "";
        const res = NextResponse.redirect(url);
        return finishPageResponse(res, rid, nonce, request);
      }
      /* token inválido — deixa entrar em login */
    }

    if (isProtected) {
      if (!token) {
        if (refreshToken) return refreshRedirect();
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("from", pathname);
        const res = NextResponse.redirect(url);
        return finishPageResponse(res, rid, nonce, request);
      }

      const payload = await verifyAccessJwt(token);
      if (!payload) {
        if (refreshToken) return refreshRedirect();
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("from", pathname);
        const res = NextResponse.redirect(url);
        return finishPageResponse(res, rid, nonce, request);
      }
    }
  }

  if (!pathnameHasLocale(pathname) && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = toInternalLocalePath(pathname);
    const rewriteRes = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    return finishPageResponse(rewriteRes, rid, nonce, request);
  }

  const withRid = new NextRequest(request, { headers: requestHeaders });
  const intlResponse = await Promise.resolve(intlMiddleware(withRid));
  return finishPageResponse(intlResponse, rid, nonce, request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|\\.well-known|.*\\..*).*)"],
};
