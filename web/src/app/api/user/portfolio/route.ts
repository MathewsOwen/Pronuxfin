import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUserId } from "@/lib/auth/session-user";
import { parseZodBody } from "@/lib/http/parse-zod-body";
import {
  deleteUserPortfolioPosition,
  getUserPortfolioPosition,
  isValidPortfolioSymbol,
  listUserPortfolioPositions,
  normalizePortfolioSymbol,
  upsertUserPortfolioPosition,
} from "@/lib/user-portfolio/load";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PORTFOLIO_POSITIONS = 100;

const unauthorized = NextResponse.json(
  { ok: false as const, message: "Sessão necessária." },
  { status: 401 },
);

const upsertSchema = z.object({
  symbol: z.string().min(1).max(16),
  quantity: z.number().positive(),
  averageCost: z.number().positive(),
  currency: z.string().min(3).max(3).optional(),
  note: z.string().max(240).nullable().optional(),
});

const deleteSchema = z.object({
  symbol: z.string().min(1).max(16),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized;

  const items = await listUserPortfolioPositions(userId);
  return NextResponse.json({ ok: true as const, items });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized;

  const parsed = await parseBody(req, upsertSchema);
  if (!parsed.ok) return parsed.response;

  const symbol = normalizePortfolioSymbol(parsed.data.symbol);
  const existing = await getUserPortfolioPosition(userId, symbol);
  if (!existing) {
    const count = await listUserPortfolioPositions(userId);
    if (count.length >= MAX_PORTFOLIO_POSITIONS) {
      return NextResponse.json(
        {
          ok: false as const,
          message: `Limite de ${MAX_PORTFOLIO_POSITIONS} posições na carteira.`,
        },
        { status: 400 },
      );
    }
  }

  if (!isValidPortfolioSymbol(symbol)) {
    return NextResponse.json(
      { ok: false as const, message: "Símbolo inválido." },
      { status: 400 },
    );
  }

  try {
    const item = await upsertUserPortfolioPosition(userId, {
      symbol,
      quantity: parsed.data.quantity,
      averageCost: parsed.data.averageCost,
      currency: parsed.data.currency,
      note: parsed.data.note,
    });
    return NextResponse.json({ ok: true as const, item });
  } catch {
    return NextResponse.json(
      { ok: false as const, message: "Não foi possível guardar a posição." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized;

  const parsed = await parseBody(req, deleteSchema);
  if (!parsed.ok) return parsed.response;

  const symbol = normalizePortfolioSymbol(parsed.data.symbol);
  try {
    await deleteUserPortfolioPosition(userId, symbol);
    return NextResponse.json({ ok: true as const, symbol });
  } catch {
    return NextResponse.json(
      { ok: false as const, message: "Não foi possível remover a posição." },
      { status: 500 },
    );
  }
}

async function parseBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<
  | { ok: true; data: z.infer<T> }
  | { ok: false; response: NextResponse<{ ok: false; message: string }> }
> {
  return parseZodBody(req, schema);
}
