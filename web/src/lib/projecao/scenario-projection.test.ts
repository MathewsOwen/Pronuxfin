import { describe, expect, it } from "vitest";
import {
  buildAllScenarioBands,
  buildScenarioBandSeries,
  computeGoalProjection,
  scenarioAnnualReturn,
} from "@/lib/projecao/scenario-projection";

describe("scenario-projection", () => {
  it("spreads pessimistic/base/optimistic around base rate", () => {
    expect(scenarioAnnualReturn(10, "pessimistic")).toBe(6);
    expect(scenarioAnnualReturn(10, "base")).toBe(10);
    expect(scenarioAnnualReturn(10, "optimistic")).toBe(14);
  });

  it("builds monotonic scenario finals when rate increases", () => {
    const input = {
      initial: 10_000,
      monthlyContribution: 500,
      years: 10,
      baseAnnualReturnPct: 10,
    };
    const bands = buildAllScenarioBands(input);
    expect(bands[0]!.finalBalance).toBeLessThan(bands[1]!.finalBalance);
    expect(bands[1]!.finalBalance).toBeLessThan(bands[2]!.finalBalance);
  });

  it("computes goal gap and extra contribution hint", () => {
    const goal = computeGoalProjection({
      initial: 5_000,
      monthlyContribution: 200,
      targetAmount: 500_000,
      years: 5,
      annualReturnPct: 8,
    });
    expect(goal.onTrack).toBe(false);
    expect(goal.gap).toBeGreaterThan(0);
    expect(goal.suggestedExtraMonthly).toBeGreaterThan(0);
  });

  it("yearly points include year zero", () => {
    const series = buildScenarioBandSeries(
      {
        initial: 1_000,
        monthlyContribution: 100,
        years: 3,
        baseAnnualReturnPct: 9,
      },
      "base",
    );
    expect(series.points[0]?.year).toBe(0);
    expect(series.points.at(-1)?.year).toBe(3);
  });
});
