-- Watchlist privada por utilizador para comparação e acompanhamento dentro do painel.
CREATE TABLE "UserWatchlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWatchlistItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserWatchlistItem_userId_symbol_key"
  ON "UserWatchlistItem"("userId", "symbol");

CREATE INDEX "UserWatchlistItem_userId_createdAt_idx"
  ON "UserWatchlistItem"("userId", "createdAt");

ALTER TABLE "UserWatchlistItem" ADD CONSTRAINT "UserWatchlistItem_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
