import createMiddleware from "next-intl/middleware";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/constants";
import { isJwtSecretConfigured, readTrimmedEnv } from "@/lib/env/server-env";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

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
        res.headers.set("x-request-id", rid);
        return res;
      }
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("from", pathname);
      const res = NextResponse.redirect(url);
      res.headers.set("x-request-id", rid);
      return res;
    }

    const secret = readTrimmedEnv("JWT_SECRET");
    const token = request.cookies.get(AUTH_COOKIE)?.value;

    if (isAuthEntry && token) {
      try {
        await jwtVerify(token, new TextEncoder().encode(secret));
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        url.search = "";
        const res = NextResponse.redirect(url);
        res.headers.set("x-request-id", rid);
        return res;
      } catch {
        /* token inválido — deixa entrar em login */
      }
    }

    if (isProtected) {
      if (!token) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("from", pathname);
        const res = NextResponse.redirect(url);
        res.headers.set("x-request-id", rid);
        return res;
      }

      try {
        await jwtVerify(token, new TextEncoder().encode(secret));
      } catch {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("from", pathname);
        const res = NextResponse.redirect(url);
        res.headers.set("x-request-id", rid);
        return res;
      }
    }
  }

  if (!pathnameHasLocale(pathname) && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = toInternalLocalePath(pathname);
    const rewriteRes = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
    rewriteRes.headers.set("x-request-id", rid);
    return rewriteRes;
  }

  const withRid = new NextRequest(request, { headers: requestHeaders });
  const intlResponse = await Promise.resolve(intlMiddleware(withRid));
  intlResponse.headers.set("x-request-id", rid);
  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|\\.well-known|.*\\..*).*)"],
};
