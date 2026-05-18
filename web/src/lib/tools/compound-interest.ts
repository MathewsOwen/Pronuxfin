export type CompoundFrequency = "monthly" | "yearly";

export type CompoundInterestInput = {
  initial: number;
  monthlyContribution: number;
  annualRatePercent: number;
  years: number;
  frequency: CompoundFrequency;
};

export type CompoundInterestPoint = {
  month: number;
  balance: number;
  contributed: number;
};

export type CompoundInterestResult = {
  finalBalance: number;
  totalContributed: number;
  totalInterest: number;
  series: CompoundInterestPoint[];
};

export function computeCompoundInterest(input: CompoundInterestInput): CompoundInterestResult {
  const months = Math.max(0, Math.round(input.years * 12));
  const monthlyRate = input.annualRatePercent / 100 / 12;
  const series: CompoundInterestPoint[] = [];
  let balance = Math.max(0, input.initial);
  let contributed = balance;

  series.push({ month: 0, balance, contributed });

  for (let m = 1; m <= months; m += 1) {
    balance = balance * (1 + monthlyRate) + Math.max(0, input.monthlyContribution);
    contributed += Math.max(0, input.monthlyContribution);
    series.push({ month: m, balance, contributed });
  }

  const finalBalance = balance;
  const totalContributed = contributed;
  const totalInterest = finalBalance - totalContributed;

  return {
    finalBalance,
    totalContributed,
    totalInterest,
    series,
  };
}

export type CompoundScenarioPayload = CompoundInterestInput & {
  label?: string;
};

export const COMPOUND_SCENARIO_STORAGE_KEY = "pronuxfin.compound-scenario.v1";
