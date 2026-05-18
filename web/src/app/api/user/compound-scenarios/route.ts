import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUserId } from "@/lib/auth/session-user";
import { prisma } from "@/lib/prisma";
import type { CompoundScenarioPayload } from "@/lib/tools/compound-interest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_COMPOUND_SCENARIOS = 20;

const unauthorized = NextResponse.json(
  { ok: false as const, message: "Sessão necessária." },
  { status: 401 },
);

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
  const userId = await getSessionUserId();
  if (!userId) return unauthorized;

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
  const userId = await getSessionUserId();
  if (!userId) return unauthorized;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false as const, message: "JSON inválido." },
      { status: 400 },
    );
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false as const, message: "Cenário inválido." },
      { status: 400 },
    );
  }

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
  const userId = await getSessionUserId();
  if (!userId) return unauthorized;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false as const, message: "JSON inválido." },
      { status: 400 },
    );
  }

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false as const, message: "ID inválido." },
      { status: 400 },
    );
  }

  await prisma.userCompoundScenario.deleteMany({
    where: { id: parsed.data.id, userId },
  });

  return NextResponse.json({ ok: true as const });
}
