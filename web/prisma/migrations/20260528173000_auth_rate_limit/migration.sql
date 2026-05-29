-- Distributed (DB-backed) rate-limit counters for auth routes.
CREATE TABLE "AuthRateLimit" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthRateLimit_expiresAt_idx" ON "AuthRateLimit"("expiresAt");
