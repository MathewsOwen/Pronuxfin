import type { MarketProviderId } from "@/lib/market/market-provider-registry";
import { prisma } from "@/lib/prisma";

function utcMonthKey(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function monthExpiresAt(monthKey: string): Date {
  const [yearRaw, monthRaw] = monthKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  return new Date(Date.UTC(year, month, 1));
}

function budgetRowId(id: MarketProviderId, monthKey: string): string {
  return `mp-budget:${id}:${monthKey}`;
}

/** Monthly usage counter shared across serverless instances. Returns null on DB error. */
export async function readDistributedProviderUsage(
  id: MarketProviderId,
): Promise<number | null> {
  const monthKey = utcMonthKey();
  try {
    const row = await prisma.authRateLimit.findUnique({
      where: { id: budgetRowId(id, monthKey) },
      select: { count: true },
    });
    return row?.count ?? 0;
  } catch {
    return null;
  }
}

/** Increments the distributed monthly counter. Returns false on DB error. */
export async function incrementDistributedProviderUsage(
  id: MarketProviderId,
): Promise<boolean> {
  const monthKey = utcMonthKey();
  const rowId = budgetRowId(id, monthKey);
  try {
    await prisma.authRateLimit.upsert({
      where: { id: rowId },
      create: {
        id: rowId,
        count: 1,
        expiresAt: monthExpiresAt(monthKey),
      },
      update: { count: { increment: 1 } },
    });

    if (Math.random() < 0.02) {
      await prisma.authRateLimit
        .deleteMany({ where: { expiresAt: { lt: new Date() } } })
        .catch(() => {});
    }

    return true;
  } catch {
    return false;
  }
}
