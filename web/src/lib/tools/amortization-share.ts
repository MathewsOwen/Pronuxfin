import {
  defaultAmortizationInput,
  normalizeAmortizationInput,
  type AmortizationInput,
  type AmortizationSystem,
  type CreditPaymentMode,
  type DebtKind,
  type ExtraPaymentStrategy,
} from "./amortization";

const SHARE_KEYS = {
  debtKind: "dk",
  assetValue: "av",
  downPayment: "dp",
  annualRatePercent: "ar",
  termMonths: "tm",
  system: "sy",
  insuranceMonthly: "in",
  extraMonthly: "ex",
  extraStrategy: "es",
  lumpSum: "ls",
  lumpSumMonth: "lm",
  creditMinimumPercent: "cm",
  creditPaymentMode: "cp",
  creditFixedPayment: "cf",
  adminFeesMonthly: "af",
  iofUpfront: "io",
} as const;

function readNumber(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function encodeAmortizationShare(input: AmortizationInput): string {
  const params = new URLSearchParams();
  params.set(SHARE_KEYS.debtKind, input.debtKind);
  params.set(SHARE_KEYS.assetValue, String(input.assetValue));
  params.set(SHARE_KEYS.downPayment, String(input.downPayment));
  params.set(SHARE_KEYS.annualRatePercent, String(input.annualRatePercent));
  params.set(SHARE_KEYS.termMonths, String(input.termMonths));
  params.set(SHARE_KEYS.system, input.system);
  params.set(SHARE_KEYS.insuranceMonthly, String(input.insuranceMonthly));
  params.set(SHARE_KEYS.extraMonthly, String(input.extraMonthly));
  params.set(SHARE_KEYS.extraStrategy, input.extraStrategy);
  params.set(SHARE_KEYS.lumpSum, String(input.lumpSum));
  params.set(SHARE_KEYS.lumpSumMonth, String(input.lumpSumMonth));
  params.set(SHARE_KEYS.creditMinimumPercent, String(input.creditMinimumPercent));
  params.set(SHARE_KEYS.creditPaymentMode, input.creditPaymentMode);
  params.set(SHARE_KEYS.creditFixedPayment, String(input.creditFixedPayment));
  params.set(SHARE_KEYS.adminFeesMonthly, String(input.adminFeesMonthly));
  params.set(SHARE_KEYS.iofUpfront, String(input.iofUpfront));
  return params.toString();
}

export function decodeAmortizationShare(search: string): AmortizationInput | null {
  try {
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    const debtKind = params.get(SHARE_KEYS.debtKind) as DebtKind | null;
    if (!debtKind) return null;
    const defaults = defaultAmortizationInput(debtKind);

    return normalizeAmortizationInput({
      debtKind,
      assetValue: readNumber(params.get(SHARE_KEYS.assetValue), defaults.assetValue),
      downPayment: readNumber(params.get(SHARE_KEYS.downPayment), defaults.downPayment),
      annualRatePercent: readNumber(
        params.get(SHARE_KEYS.annualRatePercent),
        defaults.annualRatePercent,
      ),
      termMonths: Math.max(
        1,
        Math.round(readNumber(params.get(SHARE_KEYS.termMonths), defaults.termMonths)),
      ),
      system: (params.get(SHARE_KEYS.system) as AmortizationSystem | null) ?? defaults.system,
      insuranceMonthly: readNumber(
        params.get(SHARE_KEYS.insuranceMonthly),
        defaults.insuranceMonthly,
      ),
      extraMonthly: readNumber(params.get(SHARE_KEYS.extraMonthly), defaults.extraMonthly),
      extraStrategy:
        (params.get(SHARE_KEYS.extraStrategy) as ExtraPaymentStrategy | null) ??
        defaults.extraStrategy,
      lumpSum: readNumber(params.get(SHARE_KEYS.lumpSum), defaults.lumpSum),
      lumpSumMonth: Math.max(
        1,
        Math.round(readNumber(params.get(SHARE_KEYS.lumpSumMonth), defaults.lumpSumMonth)),
      ),
      creditMinimumPercent: readNumber(
        params.get(SHARE_KEYS.creditMinimumPercent),
        defaults.creditMinimumPercent,
      ),
      creditPaymentMode:
        (params.get(SHARE_KEYS.creditPaymentMode) as CreditPaymentMode | null) ??
        defaults.creditPaymentMode,
      creditFixedPayment: readNumber(
        params.get(SHARE_KEYS.creditFixedPayment),
        defaults.creditFixedPayment,
      ),
      adminFeesMonthly: readNumber(
        params.get(SHARE_KEYS.adminFeesMonthly),
        defaults.adminFeesMonthly,
      ),
      iofUpfront: readNumber(params.get(SHARE_KEYS.iofUpfront), defaults.iofUpfront),
    });
  } catch {
    return null;
  }
}
