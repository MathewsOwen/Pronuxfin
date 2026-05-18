import { NextResponse } from "next/server";

/** Limite de corpo JSON em rotas de auth proxy (evita DoS por payload gigante). */
export const MAX_JSON_BODY_BYTES = 16_384;

/** Evita 500 não tratado quando o corpo não é JSON válido (proxy auth e APIs form). */
export async function readRequestJson(req: Request): Promise<
  | { ok: true; value: unknown }
  | {
      ok: false;
      response: NextResponse<{ message: string; code: string }>;
    }
> {
  const lenHeader = req.headers.get("content-length");
  if (lenHeader) {
    const len = Number.parseInt(lenHeader, 10);
    if (Number.isFinite(len) && len > MAX_JSON_BODY_BYTES) {
      return {
        ok: false,
        response: NextResponse.json(
          { message: "Corpo da requisição demasiado grande.", code: "BODY_TOO_LARGE" },
          { status: 413 },
        ),
      };
    }
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Não foi possível ler o corpo.", code: "INVALID_JSON_BODY" },
        { status: 400 },
      ),
    };
  }

  if (raw.length > MAX_JSON_BODY_BYTES) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Corpo da requisição demasiado grande.", code: "BODY_TOO_LARGE" },
        { status: 413 },
      ),
    };
  }

  if (!raw.trim()) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "JSON inválido no corpo.", code: "INVALID_JSON_BODY" },
        { status: 400 },
      ),
    };
  }

  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "JSON inválido no corpo.", code: "INVALID_JSON_BODY" },
        { status: 400 },
      ),
    };
  }
}
