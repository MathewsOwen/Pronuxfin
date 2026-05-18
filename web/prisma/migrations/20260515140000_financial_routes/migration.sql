-- CreateTable
CREATE TABLE "UserFinancialRoute" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "goalType" TEXT NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "initialAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyContribution" DOUBLE PRECISION NOT NULL,
    "assumedReturnPct" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "assumedInflationPct" DOUBLE PRECISION NOT NULL DEFAULT 4.5,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "linkPortfolio" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFinancialRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFinancialRouteAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "paramsJson" JSONB NOT NULL,
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFinancialRouteAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserFinancialRoute_userId_updatedAt_idx" ON "UserFinancialRoute"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "UserFinancialRouteAlert_userId_routeId_createdAt_idx" ON "UserFinancialRouteAlert"("userId", "routeId", "createdAt");

-- CreateIndex
CREATE INDEX "UserFinancialRouteAlert_userId_dismissedAt_idx" ON "UserFinancialRouteAlert"("userId", "dismissedAt");

-- AddForeignKey
ALTER TABLE "UserFinancialRoute" ADD CONSTRAINT "UserFinancialRoute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFinancialRouteAlert" ADD CONSTRAINT "UserFinancialRouteAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFinancialRouteAlert" ADD CONSTRAINT "UserFinancialRouteAlert_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "UserFinancialRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
