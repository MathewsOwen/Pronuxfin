CREATE TABLE "UserPortfolioPosition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "averageCost" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPortfolioPosition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserPortfolioPosition_userId_symbol_key"
  ON "UserPortfolioPosition"("userId", "symbol");

CREATE INDEX "UserPortfolioPosition_userId_updatedAt_idx"
  ON "UserPortfolioPosition"("userId", "updatedAt");

ALTER TABLE "UserPortfolioPosition" ADD CONSTRAINT "UserPortfolioPosition_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UserCompoundScenario" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCompoundScenario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserCompoundScenario_userId_updatedAt_idx"
  ON "UserCompoundScenario"("userId", "updatedAt");

ALTER TABLE "UserCompoundScenario" ADD CONSTRAINT "UserCompoundScenario_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
