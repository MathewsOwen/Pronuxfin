import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUserId } from "@/lib/auth/session-user";
import { prisma } from "@/lib/prisma";
import {
  detectWatchlistRegion,
  isValidWatchlistSymbol,
  listUserWatchlist,
  normalizeWatchlistSymbol,
} from "@/lib/user-watchlist/load";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_WATCHLIST_ITEMS = 50;

const unauthorized = NextResponse.json(
  { ok: false as const, message: "Sessão necessária." },
  { status: 401 },
);

const mutationSchema = z.object({
  symbol: z.string().min(1).max(16),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized;

  const items = await listUserWatchlist(userId);
  return NextResponse.json({
    ok: true as const,
    items,
  });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized;

  const parsed = await parseMutationBody(req);
  if (!parsed.ok) return parsed.response;

  const symbol = parsed.symbol;

  const existing = await prisma.userWatchlistItem.findUnique({
    where: { userId_symbol: { userId, symbol } },
    select: { symbol: true },
  });
  if (!existing) {
    const count = await prisma.userWatchlistItem.count({ where: { userId } });
    if (count >= MAX_WATCHLIST_ITEMS) {
      return NextResponse.json(
        {
          ok: false as const,
          message: `Limite de ${MAX_WATCHLIST_ITEMS} ativos na watchlist.`,
        },
        { status: 400 },
      );
    }
  }

  try {
    await prisma.userWatchlistItem.upsert({
      where: {
        userId_symbol: { userId, symbol },
      },
      create: {
        userId,
        symbol,
        region: detectWatchlistRegion(symbol),
      },
      update: {
        updatedAt: new Date(),
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false as const, message: "Não foi possível salvar este ativo." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true as const, symbol });
}

export async function DELETE(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized;

  const parsed = await parseMutationBody(req);
  if (!parsed.ok) return parsed.response;

  try {
    await prisma.userWatchlistItem.deleteMany({
      where: {
        userId,
        symbol: parsed.symbol,
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false as const, message: "Não foi possível remover este ativo." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true as const, symbol: parsed.symbol });
}

async function parseMutationBody(
  req: Request,
): Promise<
  | { ok: true; symbol: string }
  | { ok: false; response: NextResponse<{ ok: false; message: string }> }
> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false as const, message: "JSON inválido no corpo." },
        { status: 400 },
      ),
    };
  }

  const parsed = mutationSchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false as const, message: "Body inválido: informe o símbolo." },
        { status: 400 },
      ),
    };
  }

  const symbol = normalizeWatchlistSymbol(parsed.data.symbol);
  if (!isValidWatchlistSymbol(symbol)) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false as const, message: "Símbolo inválido." },
        { status: 400 },
      ),
    };
  }

  return { ok: true, symbol };
}
