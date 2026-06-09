import { NextResponse } from "next/server";

/** Limite de corpo JSON em rotas de auth proxy (evita DoS por payload gigante). */
export const MAX_JSON_BODY_BYTES = 16_384;

/** Mutações de utilizador (watchlist, perfil, cenários). */
export const MAX_USER_MUTATION_BODY_BYTES = 65_536;

/** Importação em lote (carteira). */
export const MAX_BULK_BODY_BYTES = 131_072;

/** Chat IA (até 28 mensagens × 8 KB). */
export const MAX_MARKET_AI_BODY_BYTES = 262_144;

export type ReadJsonBodyOptions = {
  maxBytes?: number;
};

/** Evita 500 não tratado quando o corpo não é JSON válido (proxy auth e APIs form). */
export async function readRequestJson(
  req: Request,
  options?: ReadJsonBodyOptions,
): Promise<
  | { ok: true; value: unknown }
  | {
      ok: false;
      response: NextResponse<{ message: string; code: string }>;
    }
> {
  const maxBytes = options?.maxBytes ?? MAX_JSON_BODY_BYTES;
  const lenHeader = req.headers.get("content-length");
  if (lenHeader) {
    const len = Number.parseInt(lenHeader, 10);
    if (Number.isFinite(len) && len > maxBytes) {
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

  if (raw.length > maxBytes) {
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
