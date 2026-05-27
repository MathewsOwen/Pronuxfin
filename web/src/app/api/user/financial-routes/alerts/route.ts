import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth/require-session-user";
import { dismissRouteAlert } from "@/lib/financial-route/load";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dismissSchema = z.object({ id: z.string().cuid() });

export async function POST(req: Request) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;
  const { userId } = session;

  try {
    const json: unknown = await req.json();
    const { id } = dismissSchema.parse(json);
    await dismissRouteAlert(userId, id);
    return NextResponse.json({ ok: true as const });
  } catch {
    return NextResponse.json(
      { ok: false as const, message: "Pedido inválido." },
      { status: 400 },
    );
  }
}
