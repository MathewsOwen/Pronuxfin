import { prisma } from "@/lib/prisma";
import {
  isValidPortfolioSymbol,
  normalizePortfolioSymbol,
  upsertUserPortfolioPosition,
} from "@/lib/user-portfolio/load";

export const MAX_BULK_PORTFOLIO_ITEMS = 20;

export type PortfolioBulkRow = {
  symbol: string;
  quantity: number;
  averageCost: number;
};

export type PortfolioBulkResult = {
  saved: string[];
  failed: Array<{ symbol: string; reason: string }>;
};

export async function bulkUpsertUserPortfolio(
  userId: string,
  rows: PortfolioBulkRow[],
): Promise<PortfolioBulkResult> {
  const saved: string[] = [];
  const failed: Array<{ symbol: string; reason: string }> = [];

  const unique = new Map<string, PortfolioBulkRow>();
  for (const row of rows) {
    const symbol = normalizePortfolioSymbol(row.symbol);
    if (!isValidPortfolioSymbol(symbol)) {
      failed.push({ symbol: row.symbol, reason: "invalid_symbol" });
      continue;
    }
    if (!Number.isFinite(row.quantity) || row.quantity <= 0) {
      failed.push({ symbol, reason: "invalid_quantity" });
      continue;
    }
    if (!Number.isFinite(row.averageCost) || row.averageCost <= 0) {
      failed.push({ symbol, reason: "invalid_average_cost" });
      continue;
    }
    unique.set(symbol, {
      symbol,
      quantity: row.quantity,
      averageCost: row.averageCost,
    });
  }

  const entries = [...unique.values()].slice(0, MAX_BULK_PORTFOLIO_ITEMS);
  if (unique.size > MAX_BULK_PORTFOLIO_ITEMS) {
    for (const row of [...unique.values()].slice(MAX_BULK_PORTFOLIO_ITEMS)) {
      failed.push({ symbol: row.symbol, reason: "batch_limit" });
    }
  }

  const existingCount = await prisma.userPortfolioPosition.count({ where: { userId } });
  let room = Math.max(0, 100 - existingCount);

  for (const row of entries) {
    const already = await prisma.userPortfolioPosition.findUnique({
      where: { userId_symbol: { userId, symbol: row.symbol } },
      select: { symbol: true },
    });
    if (!already && room <= 0) {
      failed.push({ symbol: row.symbol, reason: "portfolio_limit" });
      continue;
    }
    try {
      await upsertUserPortfolioPosition(userId, row);
      saved.push(row.symbol);
      if (!already) room -= 1;
    } catch {
      failed.push({ symbol: row.symbol, reason: "save_failed" });
    }
  }

  return { saved, failed };
}
