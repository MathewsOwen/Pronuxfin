import { describe, expect, it } from "vitest";

import {
  calculatePricePayment,
  compareAmortizationSystems,
  computeAmortization,
  computeAmortizationSavings,
  computeCreditCardAmortization,
  defaultAmortizationInput,
  financedPrincipal,
} from "./amortization";

describe("amortization", () => {
  it("computes financed principal after down payment", () => {
    expect(financedPrincipal({ assetValue: 400_000, downPayment: 80_000 })).toBe(320_000);
  });

  it("matches classic Price installment formula", () => {
    const pmt = calculatePricePayment(100_000, 0.01, 120);
    expect(pmt).toBeGreaterThan(1_400);
    expect(pmt).toBeLessThan(1_500);
  });

  it("SAC has decreasing installments and lower total interest than Price on same loan", () => {
    const input = defaultAmortizationInput("property");
    const comparison = compareAmortizationSystems(input);
    expect(comparison.sac.firstPayment).toBeGreaterThan(comparison.sac.lastPayment);
    expect(comparison.price.firstPayment).toBeCloseTo(comparison.price.lastPayment, 0);
    expect(comparison.sac.totalInterest).toBeLessThan(comparison.price.totalInterest);
    expect(comparison.cheaperSystem).toBe("sac");
  });

  it("extra monthly payments reduce term and interest", () => {
    const base = defaultAmortizationInput("vehicle");
    const savings = computeAmortizationSavings({
      ...base,
      extraMonthly: 300,
      extraStrategy: "reduceTerm",
    });
    expect(savings.monthsSaved).toBeGreaterThan(0);
    expect(savings.interestSaved).toBeGreaterThan(0);
    expect(savings.optimized.months).toBeLessThan(savings.baseline.months);
  });

  it("lump sum amortization lowers outstanding balance faster", () => {
    const input = defaultAmortizationInput("personal");
    const baseline = computeAmortization(input);
    const withLump = computeAmortization({
      ...input,
      lumpSum: 5_000,
      lumpSumMonth: 6,
    });
    expect(withLump.months).toBeLessThanOrEqual(baseline.months);
    expect(withLump.totalInterest).toBeLessThan(baseline.totalInterest);
  });

  it("credit card minimum payment keeps debt longer than fixed payment", () => {
    const card = defaultAmortizationInput("creditCard");
    const minimum = computeCreditCardAmortization({
      ...card,
      creditPaymentMode: "minimum",
    });
    const fixed = computeCreditCardAmortization({
      ...card,
      creditPaymentMode: "fixed",
      creditFixedPayment: 1_200,
    });
    expect(minimum.months).toBeGreaterThan(fixed.months);
    expect(minimum.totalInterest).toBeGreaterThan(fixed.totalInterest);
  });
});
