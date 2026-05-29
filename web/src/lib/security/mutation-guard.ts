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
  code: "CSRF_FORBIDDEN" | "ORIGIN_FORBIDDEN" = "CSRF_FORBIDDEN",
): NextResponse {
  return NextResponse.json(
    {
      ok: false as const,
      code,
      message:
        code === "ORIGIN_FORBIDDEN"
          ? "Pedido rejeitado (origem inválida)."
          : "Pedido rejeitado (proteção CSRF).",
    },
    { status: 403 },
  );
}

/**
 * Double-submit CSRF + Sec-Fetch-Site for cookie-authenticated mutations.
 */
export function assertMutationAllowed(req: Request): NextResponse | null {
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
