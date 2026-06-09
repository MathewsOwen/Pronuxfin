import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth/require-session-user";
import { parseZodBody } from "@/lib/http/parse-zod-body";
import { MAX_USER_MUTATION_BODY_BYTES } from "@/lib/http/read-json-body";
import { prisma } from "@/lib/prisma";
import type { CompoundScenarioPayload } from "@/lib/tools/compound-interest";
import { assertMutationAllowed } from "@/lib/security/mutation-guard";
import { rateLimitUserMutation } from "@/lib/security/user-mutation-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_COMPOUND_SCENARIOS = 20;

const payloadSchema = z.object({
  initial: z.number().min(0),
  monthlyContribution: z.number().min(0),
  annualRatePercent: z.number().min(0).max(100),
  years: z.number().min(0).max(80),
  frequency: z.enum(["monthly", "yearly"]),
});

const createSchema = z.object({
  label: z.string().min(1).max(80),
  payload: payloadSchema,
});

const deleteSchema = z.object({
  id: z.string().min(1),
});

export async function GET() {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;
  const { userId } = session;

  const rows = await prisma.userCompoundScenario.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 12,
  });

  return NextResponse.json({
    ok: true as const,
    items: rows.map((row) => ({
      id: row.id,
      label: row.label,
      payload: row.payloadJson as CompoundScenarioPayload,
      updatedAt: row.updatedAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const csrfBlocked = assertMutationAllowed(req);
  if (csrfBlocked) return csrfBlocked;

  const session = await requireSessionUser();
  if (!session.ok) return session.response;
  const { userId } = session;

  const limited = await rateLimitUserMutation(userId, "compound-scenarios", 20);
  if (limited) return limited;

  const parsed = await parseZodBody(req, createSchema, {
    maxBytes: MAX_USER_MUTATION_BODY_BYTES,
  });
  if (!parsed.ok) return parsed.response;

  const scenarioCount = await prisma.userCompoundScenario.count({ where: { userId } });
  if (scenarioCount >= MAX_COMPOUND_SCENARIOS) {
    return NextResponse.json(
      {
        ok: false as const,
        message: `Limite de ${MAX_COMPOUND_SCENARIOS} cenários guardados.`,
      },
      { status: 400 },
    );
  }

  try {
    const row = await prisma.userCompoundScenario.create({
      data: {
        userId,
        label: parsed.data.label.trim(),
        payloadJson: parsed.data.payload,
      },
    });
    return NextResponse.json({
      ok: true as const,
      item: {
        id: row.id,
        label: row.label,
        payload: row.payloadJson as CompoundScenarioPayload,
        updatedAt: row.updatedAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false as const, message: "Não foi possível salvar o cenário." },
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

  const limited = await rateLimitUserMutation(userId, "compound-scenarios", 20);
  if (limited) return limited;

  const parsed = await parseZodBody(req, deleteSchema, {
    maxBytes: MAX_USER_MUTATION_BODY_BYTES,
  });
  if (!parsed.ok) return parsed.response;

  await prisma.userCompoundScenario.deleteMany({
    where: { id: parsed.data.id, userId },
  });

  return NextResponse.json({ ok: true as const });
}
