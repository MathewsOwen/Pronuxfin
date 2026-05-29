import { NextResponse } from "next/server";

import { requireSessionUser } from "@/lib/auth/require-session-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_EVENTS = 30;

export async function GET() {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  try {
    const rows = await prisma.securityEvent.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: MAX_EVENTS,
      select: {
        id: true,
        eventType: true,
        ip: true,
        userAgent: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      events: rows.map((r) => ({
        id: r.id,
        eventType: r.eventType,
        ip: r.ip,
        userAgent: r.userAgent,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Não foi possível carregar o registo de segurança." },
      { status: 500 },
    );
  }
}
