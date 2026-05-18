import { z } from "zod";

export const portfolioDeleteBodySchema = z.union([
  z.object({
    symbol: z.string().min(1).max(16),
  }),
  z.object({
    clearAll: z.literal(true),
  }),
]);

export const portfolioUpsertBodySchema = z.object({
  symbol: z.string().min(1).max(16),
  quantity: z.number().positive(),
  averageCost: z.number().positive(),
  currency: z.string().min(3).max(3).optional(),
  note: z.string().max(240).nullable().optional(),
});
