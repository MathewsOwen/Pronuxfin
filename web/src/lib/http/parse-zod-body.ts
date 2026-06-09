import { NextResponse } from "next/server";
import type { z } from "zod";

import { readRequestJson, type ReadJsonBodyOptions } from "@/lib/http/read-json-body";

export type ParseZodBodyOptions = ReadJsonBodyOptions;

export async function parseZodBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
  options?: ParseZodBodyOptions,
): Promise<
  | { ok: true; data: z.infer<T> }
  | { ok: false; response: NextResponse<{ ok: false; message: string }> }
> {
  const raw = await readRequestJson(req, options);
  if (!raw.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false as const, message: "Pedido inválido." },
        { status: raw.response.status },
      ),
    };
  }

  const parsed = schema.safeParse(raw.value);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false as const, message: "Dados inválidos." },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: parsed.data };
}
