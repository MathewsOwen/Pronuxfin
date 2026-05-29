import { prisma } from "@/lib/prisma";
import {
  buildPreventiveRouteAlerts,
  computeRouteNavigationStatus,
} from "@/lib/financial-route/engine";
import { loadMacroRouteContextForUser } from "@/lib/financial-route/macro-route-context";
import type { MacroRouteContext } from "@/lib/financial-route/macro-route-context";
import type {
  EvaluatedFinancialRoute,
  FinancialGoalType,
  FinancialRouteInput,
  FinancialRouteRecord,
} from "@/lib/financial-route/types";
import { listUserPortfolioPositions } from "@/lib/user-portfolio/load";
import {
  buildPortfolioSummary,
  type PortfolioSummary,
} from "@/lib/user-portfolio/snapshot";

const GOAL_TYPES = new Set<FinancialGoalType>([
  "freedom",
  "property",
  "vehicle",
  "custom",
]);

function mapRow(row: {
  id: string;
  label: string;
  goalType: string;
  targetAmount: number;
  targetDate: Date;
  initialAmount: number;
  monthlyContribution: number;
  assumedReturnPct: number;
  assumedInflationPct: number;
  currency: string;
  linkPortfolio: boolean;
  createdAt: Date;
  updatedAt: Date;
}): FinancialRouteRecord {
  return {
    id: row.id,
    label: row.label,
    goalType: row.goalType as FinancialGoalType,
    targetAmount: row.targetAmount,
    targetDate: row.targetDate.toISOString().slice(0, 10),
    initialAmount: row.initialAmount,
    monthlyContribution: row.monthlyContribution,
    assumedReturnPct: row.assumedReturnPct,
    assumedInflationPct: row.assumedInflationPct,
    currency: row.currency,
    linkPortfolio: row.linkPortfolio,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function isValidGoalType(value: string): value is FinancialGoalType {
  return GOAL_TYPES.has(value as FinancialGoalType);
}

export async function listUserFinancialRoutes(userId: string): Promise<FinancialRouteRecord[]> {
  const rows = await prisma.userFinancialRoute.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapRow);
}

export async function upsertUserFinancialRoute(
  userId: string,
  input: FinancialRouteInput & { id?: string },
): Promise<FinancialRouteRecord> {
  const targetDate = new Date(`${input.targetDate.slice(0, 10)}T12:00:00Z`);
  const data = {
    label: input.label.trim().slice(0, 120),
    goalType: input.goalType,
    targetAmount: input.targetAmount,
    targetDate,
    initialAmount: input.initialAmount,
    monthlyContribution: input.monthlyContribution,
    assumedReturnPct: input.assumedReturnPct,
    assumedInflationPct: input.assumedInflationPct,
    currency: input.currency?.trim() || "BRL",
    linkPortfolio: input.linkPortfolio ?? true,
  };

  if (input.id) {
    const owned = await prisma.userFinancialRoute.findFirst({
      where: { id: input.id, userId },
    });
    if (!owned) throw new Error("route_not_found");
    const row = await prisma.userFinancialRoute.update({
      where: { id: input.id },
      data: { ...data, updatedAt: new Date() },
    });
    return mapRow(row);
  }

  const row = await prisma.userFinancialRoute.create({
    data: { userId, ...data },
  });
  return mapRow(row);
}

export async function deleteUserFinancialRoute(userId: string, id: string) {
  await prisma.userFinancialRoute.deleteMany({ where: { id, userId } });
}

function wealthFromPortfolioSummary(
  route: FinancialRouteRecord,
  summary: PortfolioSummary | null,
): { wealth: number; portfolioReturnPct: number | null } {
  if (!route.linkPortfolio) {
    return { wealth: route.initialAmount, portfolioReturnPct: null };
  }
  if (!summary) {
    return { wealth: route.initialAmount, portfolioReturnPct: null };
  }
  return {
    wealth: summary.marketValue > 0 ? summary.marketValue : route.initialAmount,
    portfolioReturnPct: summary.totalPnlPercent,
  };
}

export async function evaluateUserFinancialRoutes(
  userId: string,
  options?: { macro?: MacroRouteContext },
): Promise<EvaluatedFinancialRoute[]> {
  const routes = await listUserFinancialRoutes(userId);
  const macro = options?.macro ?? (await loadMacroRouteContextForUser(userId));

  let portfolioSummary: PortfolioSummary | null = null;
  if (routes.some((r) => r.linkPortfolio)) {
    const positions = await listUserPortfolioPositions(userId);
    if (positions.length > 0) {
      portfolioSummary = await buildPortfolioSummary(positions);
    }
  }

  const evaluated: EvaluatedFinancialRoute[] = [];

  for (const route of routes) {
    const { wealth, portfolioReturnPct } = wealthFromPortfolioSummary(
      route,
      portfolioSummary,
    );
    const status = computeRouteNavigationStatus(route, {
      currentWealth: wealth,
      portfolioReturnPct,
    });
    const alerts = buildPreventiveRouteAlerts(route, status, {
      macro,
      referenceInflationPct: macro.referenceInflationPct,
    });
    evaluated.push({ route, status, alerts });
  }

  return evaluated;
}

export { loadMacroRouteContextForUser };
export type { MacroRouteContext };

export async function syncRouteAlerts(userId: string, evaluated: EvaluatedFinancialRoute[]) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const item of evaluated) {
    for (const alert of item.alerts) {
      const existing = await prisma.userFinancialRouteAlert.findFirst({
        where: {
          userId,
          routeId: item.route.id,
          alertType: alert.alertType,
          dismissedAt: null,
          createdAt: { gte: since },
        },
      });
      if (existing) continue;

      await prisma.userFinancialRouteAlert.create({
        data: {
          userId,
          routeId: item.route.id,
          alertType: alert.alertType,
          severity: alert.severity,
          paramsJson: alert.params,
        },
      });
    }
  }
}

export type StoredRouteAlert = {
  id: string;
  routeId: string;
  routeLabel: string;
  alertType: string;
  severity: string;
  params: Record<string, unknown>;
  createdAt: string;
};

export async function listActiveRouteAlerts(userId: string): Promise<StoredRouteAlert[]> {
  const rows = await prisma.userFinancialRouteAlert.findMany({
    where: { userId, dismissedAt: null },
    include: { route: { select: { label: true } } },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return rows.map((row) => ({
    id: row.id,
    routeId: row.routeId,
    routeLabel: row.route.label,
    alertType: row.alertType,
    severity: row.severity,
    params: row.paramsJson as Record<string, unknown>,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function dismissRouteAlert(userId: string, alertId: string) {
  await prisma.userFinancialRouteAlert.updateMany({
    where: { id: alertId, userId },
    data: { dismissedAt: new Date() },
  });
}
