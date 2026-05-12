import { randomUUID } from "crypto";
import { REQUEST_ID_HEADER } from "@/lib/http/request-id";

/** Cabeçalhos enviados ao Nest a partir do Route Handler do Next — idioma do browser + correlação. */
export function jsonPayloadHeaders(incoming: Request): HeadersInit {
  const h = new Headers({ "Content-Type": "application/json" });
  const al = incoming.headers.get("accept-language");
  if (al) h.set("Accept-Language", al);
  const rid = incoming.headers.get(REQUEST_ID_HEADER)?.trim() || randomUUID();
  h.set("X-Request-Id", rid);
  return h;
}
