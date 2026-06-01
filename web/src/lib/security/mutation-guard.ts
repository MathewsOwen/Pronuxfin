import { NextResponse } from "next/server";

import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER,
  csrfTokensMatch,
  isAcceptableAuthEntryOrigin,
  isAcceptableSecFetchSite,
  isCsrfEnforced,
  parseCookieValue,
} from "@/lib/security/csrf";

export function mutationForbiddenResponse(
  code:
    | "CSRF_FORBIDDEN"
    | "ORIGIN_FORBIDDEN"
    | "UNSUPPORTED_MEDIA_TYPE" = "CSRF_FORBIDDEN",
): NextResponse {
  return NextResponse.json(
    {
      ok: false as const,
      code,
      message:
        code === "ORIGIN_FORBIDDEN"
          ? "Pedido rejeitado (origem inválida)."
        : code === "UNSUPPORTED_MEDIA_TYPE"
          ? "Content-Type deve ser application/json."
          : "Pedido rejeitado (proteção CSRF).",
    },
    { status: code === "UNSUPPORTED_MEDIA_TYPE" ? 415 : 403 },
  );
}

function isStrictProductionEnv(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

/** Rejects mutation bodies that are not JSON (blocks simple content-type confusion). */
export function assertJsonContentType(req: Request): NextResponse | null {
  if (!isCsrfEnforced()) return null;

  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD") return null;

  const ct = req.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (ct !== "application/json") {
    return mutationForbiddenResponse("UNSUPPORTED_MEDIA_TYPE");
  }
  return null;
}

/** Browser navigation refresh (middleware redirect) must stay same-origin. */
export function assertSameOriginNavigation(req: Request): NextResponse | null {
  if (!isCsrfEnforced()) return null;

  if (!isAcceptableSecFetchSite(req)) {
    return mutationForbiddenResponse("ORIGIN_FORBIDDEN");
  }

  if (isStrictProductionEnv()) {
    const mode = req.headers.get("sec-fetch-mode")?.trim().toLowerCase();
    if (mode && mode !== "navigate" && mode !== "same-origin") {
      return mutationForbiddenResponse("ORIGIN_FORBIDDEN");
    }
  }

  return null;
}

/**
 * Double-submit CSRF + Sec-Fetch-Site for cookie-authenticated mutations.
 */
export function assertMutationAllowed(req: Request): NextResponse | null {
  const jsonBlocked = assertJsonContentType(req);
  if (jsonBlocked) return jsonBlocked;

  if (!isCsrfEnforced()) return null;

  if (!isAcceptableSecFetchSite(req)) {
    return mutationForbiddenResponse();
  }

  const header = req.headers.get(CSRF_HEADER);
  const cookie = parseCookieValue(req.headers.get("cookie"), CSRF_COOKIE_NAME);
  if (!csrfTokensMatch(header, cookie)) {
    return mutationForbiddenResponse();
  }

  return null;
}

/** Login/register/forgot/reset — no CSRF cookie yet; bind to same origin. */
export function assertAuthEntryAllowed(req: Request): NextResponse | null {
  if (!isCsrfEnforced()) return null;

  if (!isAcceptableSecFetchSite(req) || !isAcceptableAuthEntryOrigin(req)) {
    return mutationForbiddenResponse("ORIGIN_FORBIDDEN");
  }

  return null;
}
