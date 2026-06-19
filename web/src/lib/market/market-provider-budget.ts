import {
  incrementDistributedProviderUsage,
  readDistributedProviderUsage,
} from "@/lib/market/distributed-market-provider-budget";
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

export async function canUseMarketProvider(id: MarketProviderId): Promise<boolean> {
  const limit = getMarketProviderSoftMonthlyLimit(id);
  if (!limit) return true;

  const distributed = await readDistributedProviderUsage(id);
  if (distributed !== null) {
    syncLocalFromDistributed(id, distributed);
    return distributed < limit;
  }

  return currentEntry(id).count < limit;
}

export async function noteMarketProviderUsage(id: MarketProviderId): Promise<void> {
  const entry = currentEntry(id);
  entry.count += 1;
  entry.lastUsedAt = Date.now();
  providerUsage.set(id, entry);

  await incrementDistributedProviderUsage(id);
}

export async function getMarketProviderBudgetWarning(
  id: MarketProviderId,
): Promise<string | null> {
  return (await canUseMarketProvider(id)) ? null : `${id}_budget_soft_cap`;
}

function syncLocalFromDistributed(id: MarketProviderId, count: number): void {
  providerUsage.set(id, {
    monthKey: utcMonthKey(),
    count,
    lastUsedAt: Date.now(),
  });
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
