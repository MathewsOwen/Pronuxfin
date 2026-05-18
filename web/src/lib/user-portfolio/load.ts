import { prisma } from "@/lib/prisma";
import {
  detectWatchlistRegion,
  isValidWatchlistSymbol,
  normalizeWatchlistSymbol,
} from "@/lib/user-watchlist/load";

export type UserPortfolioPositionView = {
  id: string;
  symbol: string;
  region: string;
  quantity: number;
  averageCost: number;
  currency: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export function normalizePortfolioSymbol(symbol: string) {
  return normalizeWatchlistSymbol(symbol);
}

export { isValidWatchlistSymbol as isValidPortfolioSymbol };

export async function getUserPortfolioPosition(
  userId: string,
  symbol: string,
): Promise<UserPortfolioPositionView | null> {
  const clean = normalizePortfolioSymbol(symbol);
  const row = await prisma.userPortfolioPosition.findUnique({
    where: { userId_symbol: { userId, symbol: clean } },
  });
  if (!row) return null;
  return {
    id: row.id,
    symbol: row.symbol,
    region: row.region,
    quantity: row.quantity,
    averageCost: row.averageCost,
    currency: row.currency,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listUserPortfolioPositions(
  userId: string,
): Promise<UserPortfolioPositionView[]> {
  const rows = await prisma.userPortfolioPosition.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    symbol: row.symbol,
    region: row.region,
    quantity: row.quantity,
    averageCost: row.averageCost,
    currency: row.currency,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function upsertUserPortfolioPosition(
  userId: string,
  input: {
    symbol: string;
    quantity: number;
    averageCost: number;
    currency?: string;
    note?: string | null;
  },
): Promise<UserPortfolioPositionView> {
  const symbol = normalizePortfolioSymbol(input.symbol);
  const row = await prisma.userPortfolioPosition.upsert({
    where: { userId_symbol: { userId, symbol } },
    create: {
      userId,
      symbol,
      region: detectWatchlistRegion(symbol),
      quantity: input.quantity,
      averageCost: input.averageCost,
      currency: input.currency?.trim() || (detectWatchlistRegion(symbol) === "br" ? "BRL" : "USD"),
      note: input.note ?? null,
    },
    update: {
      quantity: input.quantity,
      averageCost: input.averageCost,
      currency: input.currency?.trim() || undefined,
      note: input.note === undefined ? undefined : input.note,
      updatedAt: new Date(),
    },
  });
  return {
    id: row.id,
    symbol: row.symbol,
    region: row.region,
    quantity: row.quantity,
    averageCost: row.averageCost,
    currency: row.currency,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function deleteUserPortfolioPosition(
  userId: string,
  symbol: string,
): Promise<void> {
  await prisma.userPortfolioPosition.deleteMany({
    where: { userId, symbol: normalizePortfolioSymbol(symbol) },
  });
}
