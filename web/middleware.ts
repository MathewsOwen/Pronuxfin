import createMiddleware from "next-intl/middleware";
import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/constants";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

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
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET não configurado no frontend");
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("from", pathname);
      const res = NextResponse.redirect(url);
      res.headers.set("x-request-id", rid);
      return res;
    }

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

  const withRid = new NextRequest(request, { headers: requestHeaders });
  const intlResponse = await Promise.resolve(intlMiddleware(withRid));
  intlResponse.headers.set("x-request-id", rid);
  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|\\.well-known|.*\\..*).*)"],
};
