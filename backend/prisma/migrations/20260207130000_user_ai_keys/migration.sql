-- Bring-your-own-key: credenciais de APIs de modelo (texto cifrado).
CREATE TABLE "UserAiKeys" (
    "userId" TEXT NOT NULL,
    "openaiCipher" TEXT,
    "geminiCipher" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAiKeys_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "UserAiKeys" ADD CONSTRAINT "UserAiKeys_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
