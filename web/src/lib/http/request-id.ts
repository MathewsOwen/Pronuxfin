import { NextResponse } from "next/server";

/** Nome normalizado pelo fetch (`Headers.get` usa lowercase). */
export const REQUEST_ID_HEADER = "x-request-id";

/** Expõe o mesmo ID no JSON do BFF (cliente opcionalmente lê cabeçalho). */
export function attachRequestId(req: Request, res: NextResponse): NextResponse {
  const id = req.headers.get(REQUEST_ID_HEADER)?.trim();
  if (id) res.headers.set("X-Request-Id", id);
  return res;
}
