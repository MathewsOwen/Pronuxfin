import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth/require-session-user";
import {
  normalizeAlertRuleScope,
  type WatchlistAlertRuleType,
} from "@/lib/user-watchlist/alerts";
import {
  deleteUserWatchlistAlertRule,
  listEffectiveWatchlistAlertRules,
  upsertManyUserWatchlistAlertRules,
} from "@/lib/user-watchlist/rules";
import { assertMutationAllowed } from "@/lib/security/mutation-guard";
import { rateLimitUserMutation } from "@/lib/security/user-mutation-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mutationSchema = z.object({
  rules: z
    .array(
      z.object({
        ruleType: z.enum([
          "large_move",
          "news_flow",
          "range_extreme",
          "priority_shift",
        ]),
        threshold: z.number().min(0).max(1000),
        enabled: z.boolean(),
        symbol: z.string().max(16).optional(),
      }),
    )
    .max(16),
});

const deleteSchema = z.object({
  ruleType: z.enum([
    "large_move",
    "news_flow",
    "range_extreme",
    "priority_shift",
  ]),
  symbol: z.string().max(16).optional(),
});

export async function GET() {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;
  const { userId } = session;

  const rules = await listEffectiveWatchlistAlertRules(userId);
  return NextResponse.json({
    ok: true as const,
    rules,
  });
}

export async function PATCH(req: Request) {
  const csrfBlocked = assertMutationAllowed(req);
  if (csrfBlocked) return csrfBlocked;

  const session = await requireSessionUser();
  if (!session.ok) return session.response;
  const { userId } = session;

  const limited = await rateLimitUserMutation(userId, "watchlist-alert-rules", 25);
  if (limited) return limited;

  let body: z.infer<typeof mutationSchema>;
  try {
    const parsed = mutationSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false as const, message: "Body inválido para regras de alerta." },
        { status: 400 },
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json(
      { ok: false as const, message: "JSON inválido no corpo." },
      { status: 400 },
    );
  }

  try {
    await upsertManyUserWatchlistAlertRules(
      userId,
      body.rules.map((rule) => ({
        ruleType: normalizeRuleType(rule.ruleType),
        threshold: rule.threshold,
        enabled: rule.enabled,
        symbol: normalizeAlertRuleScope(rule.symbol),
      })),
    );
  } catch {
    return NextResponse.json(
      { ok: false as const, message: "Não foi possível persistir as regras." },
      { status: 500 },
    );
  }

  const rules = await listEffectiveWatchlistAlertRules(userId);
  return NextResponse.json({
    ok: true as const,
    rules,
  });
}

export async function DELETE(req: Request) {
  const csrfBlocked = assertMutationAllowed(req);
  if (csrfBlocked) return csrfBlocked;

  const session = await requireSessionUser();
  if (!session.ok) return session.response;
  const { userId } = session;

  const limited = await rateLimitUserMutation(userId, "watchlist-alert-rules", 25);
  if (limited) return limited;

  let body: z.infer<typeof deleteSchema>;
  try {
    const parsed = deleteSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false as const, message: "Body inválido para remoção de regra." },
        { status: 400 },
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json(
      { ok: false as const, message: "JSON inválido no corpo." },
      { status: 400 },
    );
  }

  try {
    await deleteUserWatchlistAlertRule(
      userId,
      normalizeRuleType(body.ruleType),
      normalizeAlertRuleScope(body.symbol),
    );
  } catch {
    return NextResponse.json(
      { ok: false as const, message: "Não foi possível remover a regra." },
      { status: 500 },
    );
  }

  const rules = await listEffectiveWatchlistAlertRules(userId);
  return NextResponse.json({
    ok: true as const,
    rules,
  });
}

function normalizeRuleType(value: WatchlistAlertRuleType): WatchlistAlertRuleType {
  return value;
}
