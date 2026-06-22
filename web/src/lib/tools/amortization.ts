export type DebtKind = "property" | "vehicle" | "personal" | "creditCard" | "other";

export type AmortizationSystem = "sac" | "price";

export type ExtraPaymentStrategy = "reduceTerm" | "reduceInstallment";

export type CreditPaymentMode = "minimum" | "fixed";

export type AmortizationInput = {
  debtKind: DebtKind;
  assetValue: number;
  downPayment: number;
  annualRatePercent: number;
  termMonths: number;
  system: AmortizationSystem;
  insuranceMonthly: number;
  extraMonthly: number;
  extraStrategy: ExtraPaymentStrategy;
  lumpSum: number;
  lumpSumMonth: number;
  creditMinimumPercent: number;
  creditPaymentMode: CreditPaymentMode;
  creditFixedPayment: number;
  adminFeesMonthly: number;
  iofUpfront: number;
};

export type InstallmentRow = {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  insurance: number;
  extra: number;
  balance: number;
};

export type AmortizationResult = {
  rows: InstallmentRow[];
  totalPaid: number;
  totalInterest: number;
  totalPrincipal: number;
  totalInsurance: number;
  totalExtra: number;
  months: number;
  firstPayment: number;
  lastPayment: number;
  averagePayment: number;
  cetAnnualPercent: number | null;
  nominalAnnualPercent: number;
  totalFees: number;
};

export type AmortizationComparison = {
  sac: AmortizationResult;
  price: AmortizationResult;
  interestDelta: number;
  monthsDelta: number;
  cheaperSystem: AmortizationSystem;
};

export type AmortizationSavings = {
  baseline: AmortizationResult;
  optimized: AmortizationResult;
  interestSaved: number;
  monthsSaved: number;
};

export const AMORTIZATION_SCENARIO_STORAGE_KEY = "pronuxfin.amortization-scenario.v1";

export function monthlyRateFromAnnual(annualPercent: number): number {
  return Math.max(0, annualPercent) / 100 / 12;
}

export function financedPrincipal(input: Pick<AmortizationInput, "assetValue" | "downPayment">): number {
  return Math.max(0, input.assetValue - Math.max(0, input.downPayment));
}

export function calculatePricePayment(
  principal: number,
  monthlyRate: number,
  termMonths: number,
): number {
  if (principal <= 0) return 0;
  if (termMonths <= 0) return principal;
  if (monthlyRate <= 0) return principal / termMonths;
  const factor = (1 + monthlyRate) ** termMonths;
  return (principal * monthlyRate * factor) / (factor - 1);
}

export type AmortizationInsight = {
  id: string;
  tone: "positive" | "warning" | "neutral";
};

function adminFeesMonthly(input: AmortizationInput): number {
  return Math.max(0, input.adminFeesMonthly ?? 0);
}

export function computeEffectiveMonthlyRate(
  disbursed: number,
  payments: number[],
): number | null {
  if (disbursed <= 0 || payments.length === 0) return null;
  let rate = 0.01;
  for (let iter = 0; iter < 64; iter += 1) {
    let npv = -disbursed;
    let derivative = 0;
    for (let i = 0; i < payments.length; i += 1) {
      const period = i + 1;
      const denominator = (1 + rate) ** period;
      npv += payments[i]! / denominator;
      derivative -= (period * payments[i]!) / ((1 + rate) ** (period + 1));
    }
    if (Math.abs(npv) < 0.01) return rate > 0 ? rate : null;
    if (derivative === 0) break;
    rate -= npv / derivative;
    if (rate <= -0.99) rate = -0.99;
  }
  return rate > 0 ? rate : null;
}

export function computeCetAnnualPercent(disbursed: number, payments: number[]): number | null {
  const monthly = computeEffectiveMonthlyRate(disbursed, payments);
  if (monthly == null) return null;
  return ((1 + monthly) ** 12 - 1) * 100;
}

function enrichAmortizationResult(
  input: AmortizationInput,
  result: Omit<AmortizationResult, "cetAnnualPercent" | "nominalAnnualPercent" | "totalFees">,
): AmortizationResult {
  const feesMonthly = adminFeesMonthly(input);
  const iof = Math.max(0, input.iofUpfront ?? 0);
  const disbursed = Math.max(0, financedPrincipal(input) - iof);
  const payments = result.rows.map((row) => row.payment);
  const cet =
    input.debtKind === "creditCard" ? null : computeCetAnnualPercent(disbursed, payments);

  return {
    ...result,
    cetAnnualPercent: cet,
    nominalAnnualPercent: input.annualRatePercent,
    totalFees: result.rows.length * feesMonthly + iof,
  };
}

function summarizeRows(
  rows: InstallmentRow[],
): Omit<AmortizationResult, "cetAnnualPercent" | "nominalAnnualPercent" | "totalFees"> {
  const totalInterest = rows.reduce((sum, row) => sum + row.interest, 0);
  const totalPrincipal = rows.reduce((sum, row) => sum + row.principal, 0);
  const totalInsurance = rows.reduce((sum, row) => sum + row.insurance, 0);
  const totalExtra = rows.reduce((sum, row) => sum + row.extra, 0);
  const totalPaid = rows.reduce((sum, row) => sum + row.payment, 0);
  const payments = rows.map((row) => row.payment);

  return {
    rows,
    totalPaid,
    totalInterest,
    totalPrincipal,
    totalInsurance,
    totalExtra,
    months: rows.length,
    firstPayment: payments[0] ?? 0,
    lastPayment: payments[payments.length - 1] ?? 0,
    averagePayment: payments.length > 0 ? totalPaid / payments.length : 0,
  };
}

function readExtraForMonth(input: AmortizationInput, month: number): number {
  let extra = Math.max(0, input.extraMonthly);
  if (input.lumpSumMonth === month && input.lumpSum > 0) {
    extra += input.lumpSum;
  }
  return extra;
}

export function computeSacAmortization(input: AmortizationInput): AmortizationResult {
  const principal0 = financedPrincipal(input);
  const monthlyRate = monthlyRateFromAnnual(input.annualRatePercent);
  const insurance = Math.max(0, input.insuranceMonthly);
  const fees = adminFeesMonthly(input);
  const rows: InstallmentRow[] = [];
  let balance = principal0;
  let month = 0;
  const baseSlice = principal0 / Math.max(1, input.termMonths);
  let principalSlice = baseSlice;
  const maxMonths = Math.max(input.termMonths, 1) + 360;

  while (balance > 0.005 && month < maxMonths) {
    month += 1;
    const interest = balance * monthlyRate;
    const extra = readExtraForMonth(input, month);

    if (input.extraStrategy === "reduceInstallment") {
      const remainingMonths = Math.max(1, input.termMonths - month + 1);
      principalSlice = balance / remainingMonths;
    } else {
      principalSlice = baseSlice;
    }

    const scheduledPrincipal = Math.min(balance, principalSlice);
    const principalPaid = Math.min(balance, scheduledPrincipal + extra);
    balance = Math.max(0, balance - principalPaid);

    rows.push({
      month,
      payment: principalPaid + interest + insurance + fees,
      principal: principalPaid,
      interest,
      insurance,
      extra: Math.max(0, principalPaid - scheduledPrincipal),
      balance,
    });
  }

  return enrichAmortizationResult(input, summarizeRows(rows));
}

export function computePriceAmortization(input: AmortizationInput): AmortizationResult {
  const principal0 = financedPrincipal(input);
  const monthlyRate = monthlyRateFromAnnual(input.annualRatePercent);
  const insurance = Math.max(0, input.insuranceMonthly);
  const fees = adminFeesMonthly(input);
  const rows: InstallmentRow[] = [];
  let balance = principal0;
  let month = 0;
  let installment = calculatePricePayment(principal0, monthlyRate, Math.max(1, input.termMonths));
  const maxMonths = Math.max(input.termMonths, 1) + 360;

  while (balance > 0.005 && month < maxMonths) {
    month += 1;
    const interest = balance * monthlyRate;
    const extra = readExtraForMonth(input, month);
    const scheduledPrincipal = Math.min(balance, Math.max(0, installment - interest));
    const principalPaid = Math.min(balance, scheduledPrincipal + extra);
    balance = Math.max(0, balance - principalPaid);

    rows.push({
      month,
      payment: principalPaid + interest + insurance + fees,
      principal: principalPaid,
      interest,
      insurance,
      extra: Math.max(0, principalPaid - scheduledPrincipal),
      balance,
    });

    if (balance <= 0.005) break;

    if (input.extraStrategy === "reduceInstallment" && (extra > 0 || input.lumpSum > 0)) {
      const remainingMonths = Math.max(1, input.termMonths - month);
      installment = calculatePricePayment(balance, monthlyRate, remainingMonths);
    }
  }

  return enrichAmortizationResult(input, summarizeRows(rows));
}

export function computeCreditCardAmortization(input: AmortizationInput): AmortizationResult {
  const monthlyRate = monthlyRateFromAnnual(input.annualRatePercent);
  const minPct = Math.max(0, input.creditMinimumPercent) / 100;
  const rows: InstallmentRow[] = [];
  let balance = Math.max(0, input.assetValue);
  let month = 0;
  const maxMonths = 600;

  while (balance > 0.5 && month < maxMonths) {
    month += 1;
    const interest = balance * monthlyRate;
    const extra = readExtraForMonth(input, month);

    let basePayment: number;
    if (input.creditPaymentMode === "fixed") {
      basePayment = Math.max(input.creditFixedPayment, interest + 1);
    } else {
      const minimumBody = balance * minPct;
      basePayment = Math.max(interest + minimumBody, interest + 1);
    }

    const totalBeforeCap = basePayment + extra;
    const principalPaid = Math.min(balance, Math.max(0, totalBeforeCap - interest));
    balance = Math.max(0, balance - principalPaid);

    rows.push({
      month,
      payment: principalPaid + interest,
      principal: principalPaid,
      interest,
      insurance: 0,
      extra: Math.max(0, principalPaid - Math.max(0, basePayment - interest)),
      balance,
    });
  }

  return enrichAmortizationResult(input, summarizeRows(rows));
}

export function computeAmortization(input: AmortizationInput): AmortizationResult {
  if (input.debtKind === "creditCard") {
    return computeCreditCardAmortization(input);
  }
  return input.system === "sac"
    ? computeSacAmortization(input)
    : computePriceAmortization(input);
}

export function compareAmortizationSystems(
  input: Omit<AmortizationInput, "system">,
): AmortizationComparison {
  const sac = computeSacAmortization({ ...input, system: "sac" });
  const price = computePriceAmortization({ ...input, system: "price" });
  const interestDelta = price.totalInterest - sac.totalInterest;
  const monthsDelta = price.months - sac.months;

  return {
    sac,
    price,
    interestDelta,
    monthsDelta,
    cheaperSystem: sac.totalInterest <= price.totalInterest ? "sac" : "price",
  };
}

export function computeAmortizationSavings(input: AmortizationInput): AmortizationSavings {
  const baseline = computeAmortization({
    ...input,
    extraMonthly: 0,
    lumpSum: 0,
    lumpSumMonth: 0,
  });
  const optimized = computeAmortization(input);

  return {
    baseline,
    optimized,
    interestSaved: Math.max(0, baseline.totalInterest - optimized.totalInterest),
    monthsSaved: Math.max(0, baseline.months - optimized.months),
  };
}

export function defaultAmortizationInput(debtKind: DebtKind = "property"): AmortizationInput {
  const base = {
    debtKind,
    assetValue: 0,
    downPayment: 0,
    annualRatePercent: 0,
    termMonths: 0,
    system: "sac" as AmortizationSystem,
    insuranceMonthly: 0,
    extraMonthly: 0,
    extraStrategy: "reduceTerm" as ExtraPaymentStrategy,
    lumpSum: 0,
    lumpSumMonth: 12,
    creditMinimumPercent: 15,
    creditPaymentMode: "minimum" as CreditPaymentMode,
    creditFixedPayment: 500,
    adminFeesMonthly: 0,
    iofUpfront: 0,
  };

  switch (debtKind) {
    case "property":
      return {
        ...base,
        assetValue: 450_000,
        downPayment: 90_000,
        annualRatePercent: 9.75,
        termMonths: 360,
        system: "sac",
        insuranceMonthly: 120,
      };
    case "vehicle":
      return {
        ...base,
        assetValue: 95_000,
        downPayment: 25_000,
        annualRatePercent: 1.99,
        termMonths: 48,
        system: "price",
      };
    case "personal":
      return {
        ...base,
        assetValue: 35_000,
        downPayment: 0,
        annualRatePercent: 3.89,
        termMonths: 36,
        system: "price",
      };
    case "creditCard":
      return {
        ...base,
        assetValue: 8_500,
        annualRatePercent: 14.99,
        termMonths: 0,
        system: "price",
        creditPaymentMode: "minimum",
        creditFixedPayment: 850,
        creditMinimumPercent: 15,
      };
    default:
      return {
        ...base,
        assetValue: 60_000,
        downPayment: 10_000,
        annualRatePercent: 11.5,
        termMonths: 60,
        system: "price",
      };
  }
}

export type AmortizationChartPoint = {
  month: number;
  balance: number;
  interest: number;
  principal: number;
};

export function buildAmortizationChartSeries(result: AmortizationResult): AmortizationChartPoint[] {
  return result.rows.map((row) => ({
    month: row.month,
    balance: row.balance,
    interest: row.interest,
    principal: row.principal,
  }));
}

export function normalizeAmortizationInput(
  partial: Partial<AmortizationInput> & Pick<AmortizationInput, "debtKind">,
): AmortizationInput {
  return {
    ...defaultAmortizationInput(partial.debtKind),
    ...partial,
    adminFeesMonthly: partial.adminFeesMonthly ?? 0,
    iofUpfront: partial.iofUpfront ?? 0,
  };
}

export function buildAmortizationInsights(
  input: AmortizationInput,
  result: AmortizationResult,
  comparison: AmortizationComparison | null,
): AmortizationInsight[] {
  const insights: AmortizationInsight[] = [];

  if (input.debtKind === "creditCard" && input.creditPaymentMode === "minimum" && result.months > 48) {
    insights.push({ id: "creditMinimumTrap", tone: "warning" });
  }

  if (comparison && comparison.interestDelta > result.totalInterest * 0.08) {
    insights.push({ id: "sacCheaper", tone: "positive" });
  }

  if ((input.extraMonthly > 0 || input.lumpSum > 0) && result.months < input.termMonths) {
    insights.push({ id: "extraPayoff", tone: "positive" });
  }

  if (
    result.cetAnnualPercent != null &&
    result.cetAnnualPercent > input.annualRatePercent + 1.5
  ) {
    insights.push({ id: "cetSpread", tone: "neutral" });
  }

  if (input.annualRatePercent >= 12 && input.debtKind !== "property") {
    insights.push({ id: "highRate", tone: "warning" });
  }

  return insights;
}

export function exportAmortizationCsv(result: AmortizationResult): string {
  const header = "month,payment,principal,interest,insurance,extra,balance";
  const lines = result.rows.map((row) =>
    [
      row.month,
      row.payment.toFixed(2),
      row.principal.toFixed(2),
      row.interest.toFixed(2),
      row.insurance.toFixed(2),
      row.extra.toFixed(2),
      row.balance.toFixed(2),
    ].join(","),
  );
  return [header, ...lines].join("\n");
}
