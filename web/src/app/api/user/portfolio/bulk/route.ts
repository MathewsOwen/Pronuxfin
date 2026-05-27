import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth/require-session-user";
import { parseZodBody } from "@/lib/http/parse-zod-body";
import {
  bulkUpsertUserPortfolio,
  MAX_BULK_PORTFOLIO_ITEMS,
} from "@/lib/user-portfolio/bulk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rowSchema = z.object({
  symbol: z.string().min(1).max(16),
  quantity: z.number().positive(),
  averageCost: z.number().positive(),
});

const bodySchema = z.object({
  positions: z.array(rowSchema).min(1).max(MAX_BULK_PORTFOLIO_ITEMS),
});

export async function POST(req: Request) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;
  const { userId } = session;

  const parsed = await parseZodBody(req, bodySchema);
  if (!parsed.ok) return parsed.response;

  const result = await bulkUpsertUserPortfolio(userId, parsed.data.positions);

  return NextResponse.json({
    ok: true as const,
    saved: result.saved,
    failed: result.failed,
  });
}
