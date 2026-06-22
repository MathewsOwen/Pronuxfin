import { afterEach, describe, expect, it, vi } from "vitest";

const { findUnique, upsert, deleteMany } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  upsert: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    authRateLimit: { findUnique, upsert, deleteMany },
  },
}));

import {
  incrementDistributedProviderUsage,
  readDistributedProviderUsage,
} from "@/lib/market/distributed-market-provider-budget";

describe("distributed-market-provider-budget", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reads zero when no row exists", async () => {
    findUnique.mockResolvedValue(null);
    await expect(readDistributedProviderUsage("coingecko")).resolves.toBe(0);
  });

  it("increments usage in Postgres", async () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(1);
    upsert.mockResolvedValue({ count: 1 });
    deleteMany.mockResolvedValue({ count: 0 });
    try {
      await expect(incrementDistributedProviderUsage("financial_modeling_prep")).resolves.toBe(
        true,
      );
      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: expect.stringMatching(/^mp-budget:financial_modeling_prep:\d{4}-\d{2}$/) },
        }),
      );
    } finally {
      randomSpy.mockRestore();
    }
  });
});
