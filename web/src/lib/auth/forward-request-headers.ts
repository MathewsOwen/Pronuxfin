import { randomUUID } from "crypto";
import { cookies } from "next/headers";

import { readAuthCookieValue } from "@/lib/auth/auth-cookie-names";
import { REQUEST_ID_HEADER } from "@/lib/http/request-id";

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
  if (accessToken?.trim()) {
    h.set("Authorization", `Bearer ${accessToken.trim()}`);
  }
  return h;
}

/** Lê o access token da sessão actual (Route Handlers server-side). */
export async function sessionAccessToken(): Promise<string | null> {
  return readAuthCookieValue(await cookies()) ?? null;
}
