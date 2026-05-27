import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth/require-session-user";
import { parseZodBody } from "@/lib/http/parse-zod-body";
import {
  clearUserPortfolio,
  deleteUserPortfolioPosition,
  getUserPortfolioPosition,
  isValidPortfolioSymbol,
  listUserPortfolioPositions,
  normalizePortfolioSymbol,
  upsertUserPortfolioPosition,
} from "@/lib/user-portfolio/load";
import {
  portfolioDeleteBodySchema,
  portfolioUpsertBodySchema,
} from "@/lib/user-portfolio/portfolio-api-schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PORTFOLIO_POSITIONS = 100;

const upsertSchema = portfolioUpsertBodySchema;
const deleteSchema = portfolioDeleteBodySchema;

export async function GET() {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;
  const { userId } = session;

  const items = await listUserPortfolioPositions(userId);
  return NextResponse.json({ ok: true as const, items });
}

export async function POST(req: Request) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;
  const { userId } = session;

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
  const session = await requireSessionUser();
  if (!session.ok) return session.response;
  const { userId } = session;

  const parsed = await parseBody(req, deleteSchema);
  if (!parsed.ok) return parsed.response;

  if ("clearAll" in parsed.data && parsed.data.clearAll) {
    try {
      const removed = await clearUserPortfolio(userId);
      return NextResponse.json({ ok: true as const, cleared: removed });
    } catch {
      return NextResponse.json(
        { ok: false as const, message: "Não foi possível limpar a carteira." },
        { status: 500 },
      );
    }
  }

  if (!("symbol" in parsed.data)) {
    return NextResponse.json(
      { ok: false as const, message: "Body inválido." },
      { status: 400 },
    );
  }

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
