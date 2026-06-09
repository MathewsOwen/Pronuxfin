import { randomUUID } from "crypto";
import { cookies } from "next/headers";

import { readAuthCookieValue } from "@/lib/auth/auth-cookie-names";
import { REQUEST_ID_HEADER } from "@/lib/http/request-id";

/** Forwards the end-user IP for Nest `req.ip` / REFRESH_STRICT_BIND (behind TRUST_PROXY). */
function forwardClientIp(incoming: Request, headers: Headers): void {
  const forwarded = incoming.headers.get("x-forwarded-for")?.trim();
  if (forwarded) {
    headers.set("X-Forwarded-For", forwarded);
    return;
  }
  const realIp = incoming.headers.get("x-real-ip")?.trim();
  if (realIp) {
    headers.set("X-Forwarded-For", realIp);
  }
}

/** Cabeçalhos enviados ao Nest a partir do Route Handler do Next — idioma do browser + correlação. */
export function jsonPayloadHeaders(
  incoming: Request,
  accessToken?: string | null,
): HeadersInit {
  const h = new Headers({ "Content-Type": "application/json" });
  const al = incoming.headers.get("accept-language");
  if (al) h.set("Accept-Language", al);
  const rid = incoming.headers.get(REQUEST_ID_HEADER)?.trim() || randomUUID();
  h.set("X-Request-Id", rid);
  forwardClientIp(incoming, h);
  const ua = incoming.headers.get("user-agent")?.trim();
  if (ua) h.set("User-Agent", ua);
  if (accessToken?.trim()) {
    h.set("Authorization", `Bearer ${accessToken.trim()}`);
  }
  return h;
}

/** Lê o access token da sessão actual (Route Handlers server-side). */
export async function sessionAccessToken(): Promise<string | null> {
  return readAuthCookieValue(await cookies()) ?? null;
}
