import {
  getMarketProviderSoftMonthlyLimit,
  type MarketProviderId,
} from "@/lib/market/market-provider-registry";

type BudgetEntry = {
  monthKey: string;
  count: number;
  lastUsedAt: number;
};

const providerUsage = new Map<MarketProviderId, BudgetEntry>();

export function canUseMarketProvider(id: MarketProviderId): boolean {
  const limit = getMarketProviderSoftMonthlyLimit(id);
  if (!limit) return true;
  return currentEntry(id).count < limit;
}

export function noteMarketProviderUsage(id: MarketProviderId): void {
  const entry = currentEntry(id);
  entry.count += 1;
  entry.lastUsedAt = Date.now();
  providerUsage.set(id, entry);
}

export function getMarketProviderBudgetWarning(
  id: MarketProviderId,
): string | null {
  return canUseMarketProvider(id) ? null : `${id}_budget_soft_cap`;
}

function currentEntry(id: MarketProviderId): BudgetEntry {
  const monthKey = utcMonthKey();
  const existing = providerUsage.get(id);
  if (!existing || existing.monthKey !== monthKey) {
    return {
      monthKey,
      count: 0,
      lastUsedAt: 0,
    };
  }
  return existing;
}

function utcMonthKey() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
