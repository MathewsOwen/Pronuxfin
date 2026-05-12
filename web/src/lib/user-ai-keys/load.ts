import {
  decryptAiSecret,
  parseMasterKeyHex,
} from "@/lib/crypto/ai-keys-crypto";
import { prisma } from "@/lib/prisma";

export type UserAiKeyMaterial = {
  openaiKey: string | null;
  geminiKey: string | null;
};

/** Desencriptação em memória no servidor por pedido ao modelo — nunca enviar ao browser. */
export async function loadDecryptedAiKeys(
  userId: string,
): Promise<UserAiKeyMaterial | null> {
  const master = parseMasterKeyHex();
  if (!master) return null;

  try {
    const row = await prisma.userAiKeys.findUnique({ where: { userId } });
    if (!row) return { openaiKey: null, geminiKey: null };

    let openaiKey: string | null = null;
    let geminiKey: string | null = null;

    if (row.openaiCipher) {
      try {
        openaiKey = decryptAiSecret(row.openaiCipher, master);
      } catch {
        openaiKey = null;
      }
    }

    if (row.geminiCipher) {
      try {
        geminiKey = decryptAiSecret(row.geminiCipher, master);
      } catch {
        geminiKey = null;
      }
    }

    return { openaiKey, geminiKey };
  } catch {
    return null;
  }
}

export async function userHasStoredKeyFlags(userId: string): Promise<{
  hasOpenai: boolean;
  hasGemini: boolean;
}> {
  try {
    const row = await prisma.userAiKeys.findUnique({
      where: { userId },
      select: { openaiCipher: true, geminiCipher: true },
    });
    return {
      hasOpenai: !!(row?.openaiCipher && row.openaiCipher.length > 0),
      hasGemini: !!(row?.geminiCipher && row.geminiCipher.length > 0),
    };
  } catch {
    return { hasOpenai: false, hasGemini: false };
  }
}
