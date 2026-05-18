import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";

import {
  DEFAULT_WATCHLIST_ALERT_RULES,
  normalizeAlertRuleScope,
  WATCHLIST_ALERT_RULE_ORDER,
  type WatchlistAlertRule,
  type WatchlistAlertRuleType,
} from "@/lib/user-watchlist/alerts";
import { prisma } from "@/lib/prisma";

type RulesDb = Pick<PrismaClient, "$queryRaw" | "$executeRaw">;

export async function listUserWatchlistAlertRules(
  userId: string,
): Promise<WatchlistAlertRule[]> {
  try {
    const rows = await prisma.$queryRaw<RawAlertRuleRow[]>(Prisma.sql`
      SELECT "ruleType", "threshold", "enabled", "symbol"
      FROM "UserWatchlistAlertRule"
      WHERE "userId" = ${userId}
      ORDER BY "symbol" ASC, "ruleType" ASC
    `);

    return rows.map((row) => ({
      ruleType: normalizeRuleType(row.ruleType),
      threshold: row.threshold ?? defaultThreshold(normalizeRuleType(row.ruleType)),
      enabled: row.enabled,
      symbol: row.symbol,
    }));
  } catch {
    return [];
  }
}

export async function listEffectiveWatchlistAlertRules(
  userId: string,
): Promise<WatchlistAlertRule[]> {
  const stored = await listUserWatchlistAlertRules(userId);
  const byKey = new Map<string, WatchlistAlertRule>();

  for (const rule of DEFAULT_WATCHLIST_ALERT_RULES) {
    byKey.set(`${rule.symbol}:${rule.ruleType}`, rule);
  }
  for (const rule of stored) {
    byKey.set(`${rule.symbol ?? "*"}:${rule.ruleType}`, rule);
  }

  return [...byKey.values()].sort((a, b) => {
    const scopeCompare = (a.symbol ?? "*").localeCompare(b.symbol ?? "*");
    if (scopeCompare !== 0) return scopeCompare;
    return WATCHLIST_ALERT_RULE_ORDER.indexOf(a.ruleType) - WATCHLIST_ALERT_RULE_ORDER.indexOf(b.ruleType);
  });
}

export async function upsertUserWatchlistAlertRule(
  userId: string,
  input: WatchlistAlertRule,
): Promise<void> {
  await upsertUserWatchlistAlertRuleWithDb(prisma, userId, input);
}

/** Atualiza várias regras numa única transação — evita estado a meio em falhas. */
export async function upsertManyUserWatchlistAlertRules(
  userId: string,
  inputs: WatchlistAlertRule[],
): Promise<void> {
  if (inputs.length === 0) return;
  await prisma.$transaction(async (tx) => {
    for (const input of inputs) {
      await upsertUserWatchlistAlertRuleWithDb(tx, userId, input);
    }
  });
}

async function upsertUserWatchlistAlertRuleWithDb(
  db: RulesDb,
  userId: string,
  input: WatchlistAlertRule,
): Promise<void> {
  const symbol = normalizeAlertRuleScope(input.symbol);
  const ruleType = normalizeRuleType(input.ruleType);

  const existing = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id"
    FROM "UserWatchlistAlertRule"
    WHERE "userId" = ${userId}
      AND "symbol" = ${symbol}
      AND "ruleType" = ${ruleType}
    LIMIT 1
  `);

  if (existing[0]?.id) {
    await db.$executeRaw(Prisma.sql`
      UPDATE "UserWatchlistAlertRule"
      SET "threshold" = ${input.threshold},
          "enabled" = ${input.enabled},
          "updatedAt" = NOW()
      WHERE "id" = ${existing[0].id}
    `);
    return;
  }

  await db.$executeRaw(Prisma.sql`
    INSERT INTO "UserWatchlistAlertRule"
      ("id", "userId", "symbol", "ruleType", "threshold", "enabled", "createdAt", "updatedAt")
    VALUES
      (${crypto.randomUUID()}, ${userId}, ${symbol}, ${ruleType}, ${input.threshold}, ${input.enabled}, NOW(), NOW())
  `);
}

export async function deleteUserWatchlistAlertRule(
  userId: string,
  ruleType: WatchlistAlertRuleType,
  symbol?: string | null,
): Promise<void> {
  const scope = normalizeAlertRuleScope(symbol);
  await prisma.$executeRaw(Prisma.sql`
    DELETE FROM "UserWatchlistAlertRule"
    WHERE "userId" = ${userId}
      AND "symbol" = ${scope}
      AND "ruleType" = ${ruleType}
  `);
}

function normalizeRuleType(value: string): WatchlistAlertRuleType {
  switch (value) {
    case "large_move":
    case "news_flow":
    case "range_extreme":
    case "priority_shift":
      return value;
    default:
      return "large_move";
  }
}

function defaultThreshold(ruleType: WatchlistAlertRuleType) {
  return (
    DEFAULT_WATCHLIST_ALERT_RULES.find((rule) => rule.ruleType === ruleType)?.threshold ??
    1
  );
}

type RawAlertRuleRow = {
  ruleType: string;
  threshold: number | null;
  enabled: boolean;
  symbol: string;
};
