-- Session revocation: rotating refresh tokens + global token version.

-- Global invalidation lever (logout-all, password reset, compromise).
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- Rotating refresh tokens (only the SHA-256 hash is stored).
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ip" TEXT,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RefreshToken_tokenHash_key"
  ON "RefreshToken"("tokenHash");

CREATE INDEX "RefreshToken_userId_idx"
  ON "RefreshToken"("userId");

CREATE INDEX "RefreshToken_familyId_idx"
  ON "RefreshToken"("familyId");

CREATE INDEX "RefreshToken_expiresAt_idx"
  ON "RefreshToken"("expiresAt");

ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
