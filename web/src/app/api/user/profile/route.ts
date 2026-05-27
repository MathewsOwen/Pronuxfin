import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth/require-session-user";
import { readRequestJson } from "@/lib/http/read-json-body";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
});

export async function PATCH(req: Request) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;
  const { userId } = session;

  const raw = await readRequestJson(req);
  if (!raw.ok) {
    return NextResponse.json(
      { ok: false, message: "Pedido inválido." },
      { status: raw.response.status },
    );
  }

  const parsed = schema.safeParse(raw.value);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Nome inválido." }, { status: 400 });
  }

  try {
    const row = await prisma.user.update({
      where: { id: userId },
      data: { name: parsed.data.name, updatedAt: new Date() },
      select: { id: true, email: true, name: true },
    });
    return NextResponse.json({ ok: true, user: row });
  } catch {
    return NextResponse.json({ ok: false, message: "Não foi possível atualizar o perfil." }, { status: 500 });
  }
}
