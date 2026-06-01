import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth/require-session-user";
import { parseZodBody } from "@/lib/http/parse-zod-body";
import {
  deleteUserFinancialRoute,
  evaluateUserFinancialRoutes,
  isValidGoalType,
  listActiveRouteAlerts,
  listUserFinancialRoutes,
  syncRouteAlerts,
  upsertUserFinancialRoute,
} from "@/lib/financial-route/load";
import type { FinancialGoalType } from "@/lib/financial-route/types";
import { assertMutationAllowed } from "@/lib/security/mutation-guard";
import { rateLimitUserMutation } from "@/lib/security/user-mutation-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FINANCIAL_ROUTES = 12;

const routeSchema = z.object({
  id: z.string().cuid().optional(),
  label: z.string().min(2).max(120),
  goalType: z.string().min(1).max(32),
  targetAmount: z.number().positive(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  initialAmount: z.number().min(0),
  monthlyContribution: z.number().min(0),
  assumedReturnPct: z.number().min(0).max(40),
  assumedInflationPct: z.number().min(0).max(30),
  currency: z.string().length(3).optional(),
  linkPortfolio: z.boolean().optional(),
});

const deleteSchema = z.object({ id: z.string().cuid() });

export async function GET() {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;
  const { userId } = session;

  const [evaluated, alerts] = await Promise.all([
    evaluateUserFinancialRoutes(userId),
    listActiveRouteAlerts(userId),
  ]);

  return NextResponse.json({
    ok: true as const,
    routes: evaluated,
    alerts,
  });
}

export async function POST(req: Request) {
  const csrfBlocked = assertMutationAllowed(req);
  if (csrfBlocked) return csrfBlocked;

  const session = await requireSessionUser();
  if (!session.ok) return session.response;
  const { userId } = session;

  const limited = await rateLimitUserMutation(userId, "financial-routes", 25);
  if (limited) return limited;

  const parsed = await parseBody(req, routeSchema);
  if (!parsed.ok) return parsed.response;

  if (!isValidGoalType(parsed.data.goalType)) {
    return NextResponse.json(
      { ok: false as const, message: "Tipo de meta inválido." },
      { status: 400 },
    );
  }

  if (!parsed.data.id) {
    const count = (await listUserFinancialRoutes(userId)).length;
    if (count >= MAX_FINANCIAL_ROUTES) {
      return NextResponse.json(
        {
          ok: false as const,
          message: `Limite de ${MAX_FINANCIAL_ROUTES} rotas patrimoniais.`,
        },
        { status: 400 },
      );
    }
  }

  const targetDate = new Date(`${parsed.data.targetDate}T12:00:00Z`);
  if (Number.isNaN(targetDate.getTime()) || targetDate <= new Date()) {
    return NextResponse.json(
      { ok: false as const, message: "Data alvo deve ser futura." },
      { status: 400 },
    );
  }

  try {
    const route = await upsertUserFinancialRoute(userId, {
      ...parsed.data,
      goalType: parsed.data.goalType as FinancialGoalType,
    });
    const evaluated = await evaluateUserFinancialRoutes(userId);
    await syncRouteAlerts(userId, evaluated);
    const item = evaluated.find((e) => e.route.id === route.id);
    return NextResponse.json({ ok: true as const, item: item ?? { route, status: null, alerts: [] } });
  } catch {
    return NextResponse.json(
      { ok: false as const, message: "Não foi possível guardar a rota." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const csrfBlocked = assertMutationAllowed(req);
  if (csrfBlocked) return csrfBlocked;

  const session = await requireSessionUser();
  if (!session.ok) return session.response;
  const { userId } = session;

  const limited = await rateLimitUserMutation(userId, "financial-routes", 25);
  if (limited) return limited;

  const parsed = await parseBody(req, deleteSchema);
  if (!parsed.ok) return parsed.response;

  try {
    await deleteUserFinancialRoute(userId, parsed.data.id);
    return NextResponse.json({ ok: true as const });
  } catch {
    return NextResponse.json(
      { ok: false as const, message: "Não foi possível remover a rota." },
      { status: 500 },
    );
  }
}

async function parseBody<T extends z.ZodTypeAny>(req: Request, schema: T) {
  return parseZodBody(req, schema);
}
