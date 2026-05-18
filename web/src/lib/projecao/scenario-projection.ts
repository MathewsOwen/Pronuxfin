import { projectBalance, solveExtraMonthlyContribution } from "@/lib/financial-route/engine";
import { computeCompoundInterest } from "@/lib/tools/compound-interest";

export type ScenarioBandId = "pessimistic" | "base" | "optimistic";

export type WealthProjectionInput = {
  initial: number;
  monthlyContribution: number;
  years: number;
  baseAnnualReturnPct: number;
};

export type YearlyBalancePoint = {
  year: number;
  balance: number;
  contributed: number;
};

export type ScenarioBandSeries = {
  id: ScenarioBandId;
  annualReturnPct: number;
  finalBalance: number;
  totalContributed: number;
  totalInterest: number;
  points: YearlyBalancePoint[];
};

export type ReturnPresetId =
  | "cdi"
  | "ipca_plus"
  | "balanced_br"
  | "equities_br"
  | "global_equities"
  | "crypto";

export const RETURN_PRESETS: Record<
  ReturnPresetId,
  { annualReturnPct: number; inflationPct: number }
> = {
  cdi: { annualReturnPct: 12.5, inflationPct: 4.5 },
  ipca_plus: { annualReturnPct: 8.5, inflationPct: 4.5 },
  balanced_br: { annualReturnPct: 10.5, inflationPct: 4.5 },
  equities_br: { annualReturnPct: 13.5, inflationPct: 4.5 },
  global_equities: { annualReturnPct: 11, inflationPct: 3 },
  crypto: { annualReturnPct: 18, inflationPct: 4.5 },
};

export const SCENARIO_SPREADS: Record<ScenarioBandId, number> = {
  pessimistic: -4,
  base: 0,
  optimistic: 4,
};

export function scenarioAnnualReturn(basePct: number, band: ScenarioBandId) {
  return Math.max(-25, basePct + SCENARIO_SPREADS[band]);
}

export function buildScenarioBandSeries(
  input: WealthProjectionInput,
  band: ScenarioBandId,
): ScenarioBandSeries {
  const annualReturnPct = scenarioAnnualReturn(input.baseAnnualReturnPct, band);
  const result = computeCompoundInterest({
    initial: input.initial,
    monthlyContribution: input.monthlyContribution,
    annualRatePercent: annualReturnPct,
    years: input.years,
    frequency: "monthly",
  });

  const monthsPerYear = 12;
  const points: YearlyBalancePoint[] = [];
  for (let y = 0; y <= Math.max(0, Math.round(input.years)); y += 1) {
    const month = Math.min(y * monthsPerYear, result.series.length - 1);
    const row = result.series[month]!;
    points.push({
      year: y,
      balance: row.balance,
      contributed: row.contributed,
    });
  }

  return {
    id: band,
    annualReturnPct,
    finalBalance: result.finalBalance,
    totalContributed: result.totalContributed,
    totalInterest: result.totalInterest,
    points,
  };
}

export function buildAllScenarioBands(input: WealthProjectionInput): ScenarioBandSeries[] {
  return (["pessimistic", "base", "optimistic"] as const).map((id) =>
    buildScenarioBandSeries(input, id),
  );
}

export type GoalProjectionInput = {
  initial: number;
  monthlyContribution: number;
  targetAmount: number;
  years: number;
  annualReturnPct: number;
};

export type GoalProjectionResult = {
  monthsRemaining: number;
  projectedBalance: number;
  gap: number;
  onTrack: boolean;
  progressPct: number;
  suggestedExtraMonthly: number | null;
  monthsToReachAtCurrentPace: number | null;
};

export function computeGoalProjection(input: GoalProjectionInput): GoalProjectionResult {
  const monthsRemaining = Math.max(0, Math.round(input.years * 12));
  const projectedBalance = projectBalance(
    input.initial,
    input.monthlyContribution,
    input.annualReturnPct,
    monthsRemaining,
  );
  const gap = input.targetAmount - projectedBalance;
  const onTrack = gap <= 0;
  const progressPct =
    input.targetAmount > 0
      ? Math.min(100, (projectedBalance / input.targetAmount) * 100)
      : 0;

  let monthsToReach: number | null = null;
  if (input.targetAmount > input.initial) {
    const monthlyRate = input.annualReturnPct / 100 / 12;
    let balance = Math.max(0, input.initial);
    for (let m = 1; m <= 600; m += 1) {
      balance = balance * (1 + monthlyRate) + Math.max(0, input.monthlyContribution);
      if (balance >= input.targetAmount) {
        monthsToReach = m;
        break;
      }
    }
  } else {
    monthsToReach = 0;
  }

  const monthsBehind =
    monthsToReach != null && monthsRemaining > 0 && monthsToReach > monthsRemaining
      ? monthsToReach - monthsRemaining
      : 0;

  const suggestedExtraMonthly =
    monthsBehind > 0 && monthsRemaining > 0
      ? solveExtraMonthlyContribution(
          input.initial,
          input.targetAmount,
          monthsRemaining,
          input.monthlyContribution,
          input.annualReturnPct,
        )
      : null;

  return {
    monthsRemaining,
    projectedBalance,
    gap,
    onTrack,
    progressPct,
    suggestedExtraMonthly,
    monthsToReachAtCurrentPace: monthsToReach,
  };
}

export type SensitivityCell = {
  monthlyContribution: number;
  annualReturnPct: number;
  finalBalance: number;
};

export function buildSensitivityMatrix(
  input: Pick<WealthProjectionInput, "initial" | "years">,
  monthlyContributions: number[],
  annualReturns: number[],
): SensitivityCell[] {
  const cells: SensitivityCell[] = [];
  const months = Math.max(0, Math.round(input.years * 12));
  for (const monthlyContribution of monthlyContributions) {
    for (const annualReturnPct of annualReturns) {
      cells.push({
        monthlyContribution,
        annualReturnPct,
        finalBalance: projectBalance(
          input.initial,
          monthlyContribution,
          annualReturnPct,
          months,
        ),
      });
    }
  }
  return cells;
}

export function realReturnPct(nominalPct: number, inflationPct: number) {
  const n = 1 + nominalPct / 100;
  const i = 1 + inflationPct / 100;
  return (n / i - 1) * 100;
}
