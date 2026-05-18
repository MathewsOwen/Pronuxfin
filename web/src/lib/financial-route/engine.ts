import type { MacroRouteContext } from "@/lib/financial-route/macro-route-context";
import type {
  FinancialRouteInput,
  RouteNavigationStatus,
  RoutePreventiveAlert,
} from "@/lib/financial-route/types";

const MAX_MONTHS = 600;

export function monthsBetween(from: Date, to: Date) {
  const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1);
  const end = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1);
  return Math.max(0, Math.round((end - start) / (30.4375 * 86_400_000)));
}

export function projectBalance(
  startBalance: number,
  monthlyContribution: number,
  annualReturnPct: number,
  months: number,
) {
  const monthlyRate = annualReturnPct / 100 / 12;
  let balance = Math.max(0, startBalance);
  for (let i = 0; i < months; i += 1) {
    balance = balance * (1 + monthlyRate) + Math.max(0, monthlyContribution);
  }
  return balance;
}

/** Meses até atingir meta com aportes mensais (teto 50 anos). */
export function monthsToReachTarget(
  startBalance: number,
  targetAmount: number,
  monthlyContribution: number,
  annualReturnPct: number,
): number | null {
  if (targetAmount <= 0) return 0;
  if (startBalance >= targetAmount) return 0;

  const monthlyRate = annualReturnPct / 100 / 12;
  let balance = Math.max(0, startBalance);
  for (let m = 1; m <= MAX_MONTHS; m += 1) {
    balance = balance * (1 + monthlyRate) + Math.max(0, monthlyContribution);
    if (balance >= targetAmount) return m;
  }
  return null;
}

export function solveExtraMonthlyContribution(
  startBalance: number,
  targetAmount: number,
  monthsRemaining: number,
  baseContribution: number,
  annualReturnPct: number,
): number | null {
  if (monthsRemaining <= 0 || startBalance >= targetAmount) return null;

  const atBase = projectBalance(
    startBalance,
    baseContribution,
    annualReturnPct,
    monthsRemaining,
  );
  if (atBase >= targetAmount) return null;

  let lo = 0;
  let hi = Math.max(100, targetAmount / Math.max(1, monthsRemaining));
  for (let i = 0; i < 48; i += 1) {
    const mid = (lo + hi) / 2;
    const projected = projectBalance(
      startBalance,
      baseContribution + mid,
      annualReturnPct,
      monthsRemaining,
    );
    if (projected >= targetAmount) hi = mid;
    else lo = mid;
  }
  return Math.ceil(hi / 10) * 10;
}

export function computeRouteNavigationStatus(
  route: Pick<
    FinancialRouteInput,
    | "targetAmount"
    | "targetDate"
    | "monthlyContribution"
    | "assumedReturnPct"
    | "initialAmount"
  >,
  options: {
    currentWealth: number;
    now?: Date;
    portfolioReturnPct?: number | null;
  },
): RouteNavigationStatus {
  const now = options.now ?? new Date();
  const targetDate = new Date(route.targetDate);
  const monthsRemaining = monthsBetween(now, targetDate);

  const projectedAtTargetDate = projectBalance(
    options.currentWealth,
    route.monthlyContribution,
    route.assumedReturnPct,
    monthsRemaining,
  );

  const progressPct =
    route.targetAmount > 0
      ? Math.min(100, (options.currentWealth / route.targetAmount) * 100)
      : 0;

  const monthsNeeded = monthsToReachTarget(
    options.currentWealth,
    route.targetAmount,
    route.monthlyContribution,
    route.assumedReturnPct,
  );

  const monthsBehind =
    monthsNeeded != null && monthsRemaining > 0 && monthsNeeded > monthsRemaining
      ? monthsNeeded - monthsRemaining
      : 0;

  const onTrack = projectedAtTargetDate >= route.targetAmount && monthsBehind === 0;

  let etaDate: string | null = null;
  if (monthsNeeded != null) {
    const eta = new Date(now);
    eta.setUTCMonth(eta.getUTCMonth() + monthsNeeded);
    etaDate = eta.toISOString().slice(0, 10);
  }

  const suggestedExtraMonthly =
    monthsBehind > 0 && monthsRemaining > 0
      ? solveExtraMonthlyContribution(
          options.currentWealth,
          route.targetAmount,
          monthsRemaining,
          route.monthlyContribution,
          route.assumedReturnPct,
        )
      : null;

  const plannedMonths = monthsBetween(
    new Date(now.getTime() - 30 * 86_400_000),
    targetDate,
  );
  const plannedWealth = projectBalance(
    route.initialAmount,
    route.monthlyContribution,
    route.assumedReturnPct,
    Math.max(1, plannedMonths),
  );
  const realReturnAnnualPct =
    plannedWealth > route.initialAmount && route.initialAmount > 0
      ? ((options.currentWealth / Math.max(route.initialAmount, 1)) **
          (12 / Math.max(1, plannedMonths)) -
          1) *
        100
      : options.portfolioReturnPct ?? null;

  return {
    currentWealth: options.currentWealth,
    projectedAtTargetDate,
    targetAmount: route.targetAmount,
    progressPct,
    monthsRemaining,
    monthsBehind,
    onTrack,
    etaDate,
    suggestedExtraMonthly,
    realReturnAnnualPct,
  };
}

/** Alertas preventivos genéricos — sem tickers nem recomendação de ativos. */
export function buildPreventiveRouteAlerts(
  route: Pick<
    FinancialRouteInput,
    "label" | "assumedInflationPct" | "assumedReturnPct" | "monthlyContribution"
  >,
  status: RouteNavigationStatus,
  options?: { referenceInflationPct?: number; macro?: MacroRouteContext },
): RoutePreventiveAlert[] {
  const alerts: RoutePreventiveAlert[] = [];
  const refInflation = options?.referenceInflationPct ?? options?.macro?.referenceInflationPct ?? 5.5;
  const macro = options?.macro;

  if (status.monthsBehind >= 1) {
    alerts.push({
      alertType: "schedule_behind",
      severity: status.monthsBehind >= 6 ? "critical" : status.monthsBehind >= 2 ? "warning" : "info",
      params: {
        label: route.label,
        monthsBehind: status.monthsBehind,
        monthsRemaining: status.monthsRemaining,
        extraMonthly: status.suggestedExtraMonthly ?? 0,
        hasExtra: status.suggestedExtraMonthly != null,
      },
    });
  }

  if (
    status.monthsRemaining > 0 &&
    status.monthsRemaining <= 3 &&
    !status.onTrack
  ) {
    alerts.push({
      alertType: "deadline_near",
      severity: "warning",
      params: {
        label: route.label,
        monthsRemaining: status.monthsRemaining,
      },
    });
  }

  if (route.assumedInflationPct + 1.5 < refInflation) {
    alerts.push({
      alertType: "inflation_assumption",
      severity: "info",
      params: {
        label: route.label,
        assumed: route.assumedInflationPct,
        reference: refInflation,
      },
    });
  }

  if (
    status.realReturnAnnualPct != null &&
    status.realReturnAnnualPct < route.assumedReturnPct - 4 &&
    status.monthsBehind > 0
  ) {
    alerts.push({
      alertType: "portfolio_drift",
      severity: "warning",
      params: {
        label: route.label,
        assumedReturn: route.assumedReturnPct,
        observedReturn: Math.round(status.realReturnAnnualPct * 10) / 10,
      },
    });
  }

  if (macro && (macro.hasHighImpactThisWeek || macro.hasHighImpactToday)) {
    const eventKey = macro.upcomingHighImpact.map((e) => e.id).join(",") || "macro-week";
    alerts.push({
      alertType: "macro_window",
      severity: macro.hasHighImpactToday ? "warning" : "info",
      params: {
        label: route.label,
        eventKey,
        eventSummaryPt: macro.eventSummaryPt,
        eventSummaryEn: macro.eventSummaryEn,
        eventCount: macro.upcomingHighImpact.length,
        today: macro.hasHighImpactToday,
      },
    });
  }

  return alerts;
}
