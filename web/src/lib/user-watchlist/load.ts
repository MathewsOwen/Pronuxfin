import { prisma } from "@/lib/prisma";

export type WatchlistRegion = "br" | "intl";

export type UserWatchlistItemView = {
  id: string;
  symbol: string;
  region: WatchlistRegion;
  createdAt: string;
};

export function normalizeWatchlistSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export function isValidWatchlistSymbol(symbol: string): boolean {
  return /^[A-Z0-9.-]{1,16}$/.test(symbol);
}

export function detectWatchlistRegion(symbol: string): WatchlistRegion {
  return /\d$/.test(symbol) ? "br" : "intl";
}

export async function listUserWatchlist(
  userId: string,
): Promise<UserWatchlistItemView[]> {
  try {
    const rows = await prisma.userWatchlistItem.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { symbol: "asc" }],
    });
    return rows.map((row) => ({
      id: row.id,
      symbol: row.symbol,
      region: row.region === "br" ? "br" : "intl",
      createdAt: row.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function isInUserWatchlist(
  userId: string,
  symbol: string,
): Promise<boolean> {
  try {
    const row = await prisma.userWatchlistItem.findUnique({
      where: {
        userId_symbol: {
          userId,
          symbol: normalizeWatchlistSymbol(symbol),
        },
      },
      select: { id: true },
    });
    return !!row;
  } catch {
    return false;
  }
}
