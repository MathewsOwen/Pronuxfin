import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSessionUser } from "@/lib/auth/require-session-user";
import {
  encryptAiSecret,
  isByokCryptoConfigured,
  parseMasterKeyHex,
} from "@/lib/crypto/ai-keys-crypto";
import { prisma } from "@/lib/prisma";
import { assertMutationAllowed } from "@/lib/security/mutation-guard";
import { rateLimitUserMutation } from "@/lib/security/user-mutation-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  openaiKey: z.string().max(8192).optional(),
  geminiKey: z.string().max(8192).optional(),
  clearOpenai: z.boolean().optional(),
  clearGemini: z.boolean().optional(),
});

export async function GET() {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;
  const { userId } = session;

  const cryptoReady = isByokCryptoConfigured();
  let dbReady = !!process.env.DATABASE_URL?.trim();
  let stored = { openai: false, gemini: false };

  if (dbReady) {
    try {
      const row = await prisma.userAiKeys.findUnique({
        where: { userId },
        select: { openaiCipher: true, geminiCipher: true },
      });
      stored = {
        openai: !!(row?.openaiCipher && row.openaiCipher.length > 0),
        gemini: !!(row?.geminiCipher && row.geminiCipher.length > 0),
      };
    } catch {
      dbReady = false;
    }
  }

  return NextResponse.json({
    ok: true as const,
    cryptoReady,
    dbReady,
    stored,
  });
}

export async function PATCH(req: Request) {
  const csrfBlocked = assertMutationAllowed(req);
  if (csrfBlocked) return csrfBlocked;

  const session = await requireSessionUser();
  if (!session.ok) return session.response;
  const { userId } = session;

  const limited = await rateLimitUserMutation(userId, "ai-keys", 12);
  if (limited) return limited;

  const master = parseMasterKeyHex();
  if (!master) {
    return NextResponse.json(
      {
        ok: false as const,
        message:
          "Servidor sem AI_KEYS_ENCRYPTION_KEY (hex 64 chars = 32 bytes). Configure e reinicie.",
      },
      { status: 503 },
    );
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      {
        ok: false as const,
        message:
          "DATABASE_URL não definido nesta instância Next — não é possível guardar BYOK aqui.",
      },
      { status: 503 },
    );
  }

  let parsed: z.infer<typeof patchSchema>;
  try {
    const raw = (await req.json()) as unknown;
    const r = patchSchema.safeParse(raw);
    if (!r.success) {
      return NextResponse.json(
        {
          ok: false as const,
          message:
            "Body inválido: campos opcionais openaiKey, geminiKey, clearOpenai, clearGemini.",
        },
        { status: 400 },
      );
    }
    parsed = r.data;
  } catch {
    return NextResponse.json(
      { ok: false as const, message: "JSON inválido no corpo." },
      { status: 400 },
    );
  }

  const existing = await prisma.userAiKeys.findUnique({
    where: { userId },
    select: { openaiCipher: true, geminiCipher: true },
  });

  let nextOpenai: string | null = existing?.openaiCipher ?? null;
  let nextGemini: string | null = existing?.geminiCipher ?? null;

  if (parsed.clearOpenai) nextOpenai = null;
  if (parsed.clearGemini) nextGemini = null;

  if (parsed.clearOpenai && parsed.openaiKey !== undefined && parsed.openaiKey.length > 0) {
    return NextResponse.json(
      { ok: false as const, message: "Não use clearOpenai e openaiKey ao mesmo tempo." },
      { status: 400 },
    );
  }
  if (parsed.clearGemini && parsed.geminiKey !== undefined && parsed.geminiKey.length > 0) {
    return NextResponse.json(
      { ok: false as const, message: "Não use clearGemini e geminiKey ao mesmo tempo." },
      { status: 400 },
    );
  }

  if (parsed.openaiKey !== undefined && parsed.openaiKey.length > 0) {
    nextOpenai = encryptAiSecret(parsed.openaiKey.trim(), master);
  }
  if (parsed.geminiKey !== undefined && parsed.geminiKey.length > 0) {
    nextGemini = encryptAiSecret(parsed.geminiKey.trim(), master);
  }

  try {
    await prisma.userAiKeys.upsert({
      where: { userId },
      create: {
        userId,
        openaiCipher: nextOpenai,
        geminiCipher: nextGemini,
      },
      update: {
        openaiCipher: nextOpenai,
        geminiCipher: nextGemini,
      },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false as const,
        message:
          "Não foi possível guardar as chaves neste momento. Verifique a base de dados e tente novamente.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true as const });
}
