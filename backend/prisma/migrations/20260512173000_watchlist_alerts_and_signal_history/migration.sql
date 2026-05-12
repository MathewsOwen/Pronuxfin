-- Regras de alerta e histórico de sinais da watchlist privada.
CREATE TABLE "UserWatchlistAlertRule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL DEFAULT '*',
    "ruleType" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWatchlistAlertRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserWatchlistSignalHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "attentionLevel" TEXT NOT NULL,
    "reasonsJson" JSONB NOT NULL,
    "newsCount" INTEGER NOT NULL,
    "moveAbs" DOUBLE PRECISION,
    "rangeProgress" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWatchlistSignalHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserWatchlistAlertRule_userId_symbol_ruleType_key"
  ON "UserWatchlistAlertRule"("userId", "symbol", "ruleType");

CREATE INDEX "UserWatchlistAlertRule_userId_enabled_idx"
  ON "UserWatchlistAlertRule"("userId", "enabled");

CREATE INDEX "UserWatchlistAlertRule_userId_symbol_idx"
  ON "UserWatchlistAlertRule"("userId", "symbol");

CREATE INDEX "UserWatchlistSignalHistory_userId_symbol_createdAt_idx"
  ON "UserWatchlistSignalHistory"("userId", "symbol", "createdAt");

ALTER TABLE "UserWatchlistAlertRule" ADD CONSTRAINT "UserWatchlistAlertRule_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserWatchlistSignalHistory" ADD CONSTRAINT "UserWatchlistSignalHistory_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
