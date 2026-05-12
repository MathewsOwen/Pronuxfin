import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  WatchlistAttentionLevel,
  WatchlistRadarReason,
  WatchlistRadarSignal,
} from "@/lib/user-watchlist/intelligence";

export type WatchlistSignalSnapshot = {
  symbol: string;
  priority: number;
  attentionLevel: WatchlistAttentionLevel;
  reasons: WatchlistRadarReason[];
  newsCount: number;
  moveAbs: number;
  rangeProgress: number | null;
  createdAt: string;
};

const SNAPSHOT_MIN_INTERVAL_MS = 30 * 60_000;

export async function listLatestWatchlistSignalSnapshots(
  userId: string,
  symbols: string[],
): Promise<Record<string, WatchlistSignalSnapshot>> {
  if (symbols.length === 0) return {};

  try {
    const rows = await prisma.$queryRaw<RawHistoryRow[]>(Prisma.sql`
      SELECT "symbol", "priority", "attentionLevel", "reasonsJson", "newsCount", "moveAbs", "rangeProgress", "createdAt"
      FROM "UserWatchlistSignalHistory"
      WHERE "userId" = ${userId}
        AND "symbol" IN (${Prisma.join(symbols)})
      ORDER BY "createdAt" DESC
      LIMIT ${Math.max(symbols.length * 4, 12)}
    `);

    const out: Record<string, WatchlistSignalSnapshot> = {};
    for (const row of rows) {
      if (out[row.symbol]) continue;
      out[row.symbol] = mapHistoryRow(row);
    }
    return out;
  } catch {
    return {};
  }
}

export async function listRecentWatchlistSignalSnapshots(
  userId: string,
  limit = 24,
): Promise<WatchlistSignalSnapshot[]> {
  try {
    const rows = await prisma.$queryRaw<RawHistoryRow[]>(Prisma.sql`
      SELECT "symbol", "priority", "attentionLevel", "reasonsJson", "newsCount", "moveAbs", "rangeProgress", "createdAt"
      FROM "UserWatchlistSignalHistory"
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    `);
    return rows.map(mapHistoryRow);
  } catch {
    return [];
  }
}

export async function persistWatchlistSignalSnapshots(
  userId: string,
  snapshots: Array<{
    symbol: string;
    signal: WatchlistRadarSignal;
  }>,
): Promise<void> {
  if (snapshots.length === 0) return;

  const previous = await listLatestWatchlistSignalSnapshots(
    userId,
    snapshots.map((item) => item.symbol),
  );
  const now = Date.now();

  const rows = snapshots
    .filter(({ symbol, signal }) => shouldPersist(previous[symbol], signal, now))
    .map(({ symbol, signal }) => ({
      userId,
      symbol,
      priority: signal.priority,
      attentionLevel: signal.attentionLevel,
      reasonsJson: signal.reasons as unknown as Prisma.InputJsonValue,
      newsCount: signal.newsCount,
      moveAbs: signal.moveAbs,
      rangeProgress: signal.rangeProgress,
    }));

  if (rows.length === 0) return;

  try {
    await prisma.$transaction(
      rows.map((row) =>
        prisma.$executeRaw(Prisma.sql`
          INSERT INTO "UserWatchlistSignalHistory"
            ("id", "userId", "symbol", "priority", "attentionLevel", "reasonsJson", "newsCount", "moveAbs", "rangeProgress", "createdAt")
          VALUES
            (${cryptoRandomId()}, ${row.userId}, ${row.symbol}, ${row.priority}, ${row.attentionLevel}, ${row.reasonsJson}, ${row.newsCount}, ${row.moveAbs}, ${row.rangeProgress}, NOW())
        `),
      ),
    );
  } catch {
    // Ignore transient DB issues; the UI should keep working.
  }
}

function shouldPersist(
  previous: WatchlistSignalSnapshot | undefined,
  current: WatchlistRadarSignal,
  now: number,
) {
  if (!previous) return true;

  const ageMs = now - new Date(previous.createdAt).getTime();
  if (ageMs >= SNAPSHOT_MIN_INTERVAL_MS) return true;
  if (previous.attentionLevel !== current.attentionLevel) return true;
  if (Math.abs(previous.priority - current.priority) >= 8) return true;
  if (previous.newsCount !== current.newsCount) return true;
  if ((previous.rangeProgress ?? null) !== (current.rangeProgress ?? null)) return true;
  return reasonSignature(previous.reasons) !== reasonSignature(current.reasons);
}

function reasonSignature(reasons: WatchlistRadarReason[]) {
  return reasons
    .map((reason) => `${reason.code}:${reason.value ?? ""}`)
    .sort()
    .join("|");
}

function mapHistoryRow(row: RawHistoryRow): WatchlistSignalSnapshot {
  return {
    symbol: row.symbol,
    priority: row.priority,
    attentionLevel: normalizeAttentionLevel(row.attentionLevel),
    reasons: normalizeReasons(row.reasonsJson),
    newsCount: row.newsCount,
    moveAbs: row.moveAbs ?? 0,
    rangeProgress: row.rangeProgress ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function normalizeAttentionLevel(value: string): WatchlistAttentionLevel {
  return value === "high" || value === "medium" ? value : "baseline";
}

function normalizeReasons(value: unknown): WatchlistRadarReason[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const code = "code" in item ? item.code : null;
      const rawValue = "value" in item ? item.value : undefined;
      if (typeof code !== "string") return null;
      return {
        code,
        value: typeof rawValue === "number" ? rawValue : undefined,
      } as WatchlistRadarReason;
    })
    .filter((item): item is WatchlistRadarReason => Boolean(item));
}

function cryptoRandomId() {
  return crypto.randomUUID();
}

type RawHistoryRow = {
  symbol: string;
  priority: number;
  attentionLevel: string;
  reasonsJson: unknown;
  newsCount: number;
  moveAbs: number | null;
  rangeProgress: number | null;
  createdAt: Date;
};
