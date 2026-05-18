import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUserId } from "@/lib/auth/session-user";
import { dismissRouteAlert } from "@/lib/financial-route/load";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dismissSchema = z.object({ id: z.string().cuid() });

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json(
      { ok: false as const, message: "Sessão necessária." },
      { status: 401 },
    );
  }

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
