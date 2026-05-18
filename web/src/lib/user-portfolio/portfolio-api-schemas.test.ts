import { describe, expect, it } from "vitest";

import {
  portfolioDeleteBodySchema,
  portfolioUpsertBodySchema,
} from "./portfolio-api-schemas";

describe("portfolio API schemas", () => {
  it("accepts single-symbol delete", () => {
    const result = portfolioDeleteBodySchema.safeParse({ symbol: "PETR4" });
    expect(result.success).toBe(true);
  });

  it("accepts clear-all delete", () => {
    const result = portfolioDeleteBodySchema.safeParse({ clearAll: true });
    expect(result.success).toBe(true);
  });

  it("rejects empty delete body", () => {
    const result = portfolioDeleteBodySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("requires positive quantity and average cost on upsert", () => {
    expect(
      portfolioUpsertBodySchema.safeParse({
        symbol: "PETR4",
        quantity: 10,
        averageCost: 32.5,
      }).success,
    ).toBe(true);
    expect(
      portfolioUpsertBodySchema.safeParse({
        symbol: "PETR4",
        quantity: 0,
        averageCost: 32.5,
      }).success,
    ).toBe(false);
  });
});
