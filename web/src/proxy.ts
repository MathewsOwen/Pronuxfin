import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import {
  readAuthCookieValue,
  readRefreshCookieValue,
} from "@/lib/auth/auth-cookie-names";
import { verifyAccessJwt } from "@/lib/auth/jwt-crypto";
import { confirmSessionViaUpstream } from "@/lib/auth/validate-access-session";
import { isSessionVersionCheckEnabled } from "@/lib/auth/session-version-check";
import { isJwtSecretConfigured } from "@/lib/env/server-env";
import {
  buildContentSecurityPolicy,
  cspHeaderName,
  resolveCspMode,
} from "@/lib/security/csp";
import { setCsrfCookie } from "@/lib/auth/csrf-cookie";
import { CSRF_COOKIE_NAME } from "@/lib/security/csrf-constants";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

function newPageNonce(): string {
  const bytes = new TextEncoder().encode(crypto.randomUUID());
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
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

function stripLocalePrefix(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(`/${locale}`.length) || "/";
    }
  }
  return pathname;
}

export async function proxy(request: NextRequest) {
  const existing = request.headers.get("x-request-id")?.trim();
  const rid = existing || crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", rid);

  // Playwright E2E runs `next start` over plain HTTP on 127.0.0.1 (no TLS terminator).
  if (
    process.env.NODE_ENV === "production" &&
    process.env.PLAYWRIGHT_E2E !== "1" &&
    request.headers.get("x-forwarded-proto") === "http"
  ) {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 308);
  }

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

  const barePath = stripLocalePrefix(pathname);

  const isProtected = protectedPrefixes.some(
    (p) => barePath === p || barePath.startsWith(`${p}/`),
  );

  const authEntryPaths = ["/login", "/register"];
  const isAuthEntry = authEntryPaths.includes(barePath);

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
      url.searchParams.set("from", barePath);
      const res = NextResponse.redirect(url);
      return finishPageResponse(res, rid, nonce, request);
    }

    const token = readAuthCookieValue(request.cookies);
    const refreshToken = readRefreshCookieValue(request.cookies);

    const refreshRedirect = () => {
      const url = request.nextUrl.clone();
      url.pathname = "/api/auth/refresh";
      url.search = `?from=${encodeURIComponent(barePath)}`;
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
    }

    if (isProtected) {
      if (!token) {
        if (refreshToken) return refreshRedirect();
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("from", barePath);
        const res = NextResponse.redirect(url);
        return finishPageResponse(res, rid, nonce, request);
      }

      const payload = await verifyAccessJwt(token);
      if (!payload) {
        if (refreshToken) return refreshRedirect();
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("from", barePath);
        const res = NextResponse.redirect(url);
        return finishPageResponse(res, rid, nonce, request);
      }

      if (isSessionVersionCheckEnabled()) {
        const live = await confirmSessionViaUpstream(token);
        if (!live) {
          if (refreshToken) return refreshRedirect();
          const url = request.nextUrl.clone();
          url.pathname = "/login";
          url.searchParams.set("from", barePath);
          const res = NextResponse.redirect(url);
          return finishPageResponse(res, rid, nonce, request);
        }
      }
    }
  }

  const withRid = new NextRequest(request, { headers: requestHeaders });
  const intlResponse = await Promise.resolve(intlMiddleware(withRid));
  return finishPageResponse(intlResponse, rid, nonce, request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|\\.well-known|.*\\..*).*)"],
};
