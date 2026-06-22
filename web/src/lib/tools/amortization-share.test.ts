import { describe, expect, it } from "vitest";

import { computeCetAnnualPercent, defaultAmortizationInput } from "./amortization";
import { decodeAmortizationShare, encodeAmortizationShare } from "./amortization-share";

describe("amortization-share", () => {
  it("round-trips share params", () => {
    const input = {
      ...defaultAmortizationInput("vehicle"),
      extraMonthly: 250,
      adminFeesMonthly: 35,
    };
    const decoded = decodeAmortizationShare(encodeAmortizationShare(input));
    expect(decoded?.debtKind).toBe("vehicle");
    expect(decoded?.extraMonthly).toBe(250);
    expect(decoded?.adminFeesMonthly).toBe(35);
  });
});

describe("amortization CET", () => {
  it("returns CET above nominal when fees are included in cash flows", () => {
    const disbursed = 100_000;
    const payments = Array.from({ length: 120 }, () => 1_300);
    const cet = computeCetAnnualPercent(disbursed, payments);
    expect(cet).not.toBeNull();
    expect(cet!).toBeGreaterThan(8);
  });
});
