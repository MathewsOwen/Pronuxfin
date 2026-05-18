export type FinancialGoalType = "freedom" | "property" | "vehicle" | "custom";

export type RouteAlertType =
  | "schedule_behind"
  | "portfolio_drift"
  | "inflation_assumption"
  | "deadline_near"
  | "macro_window";

export type RouteAlertSeverity = "info" | "warning" | "critical";

export type FinancialRouteInput = {
  label: string;
  goalType: FinancialGoalType;
  targetAmount: number;
  targetDate: string;
  initialAmount: number;
  monthlyContribution: number;
  assumedReturnPct: number;
  assumedInflationPct: number;
  currency?: string;
  linkPortfolio?: boolean;
};

export type FinancialRouteRecord = FinancialRouteInput & {
  id: string;
  currency: string;
  linkPortfolio: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RouteNavigationStatus = {
  currentWealth: number;
  projectedAtTargetDate: number;
  targetAmount: number;
  progressPct: number;
  monthsRemaining: number;
  monthsBehind: number;
  onTrack: boolean;
  etaDate: string | null;
  suggestedExtraMonthly: number | null;
  realReturnAnnualPct: number | null;
};

export type RoutePreventiveAlert = {
  alertType: RouteAlertType;
  severity: RouteAlertSeverity;
  params: Record<string, number | string | boolean>;
};

export type EvaluatedFinancialRoute = {
  route: FinancialRouteRecord;
  status: RouteNavigationStatus;
  alerts: RoutePreventiveAlert[];
};
