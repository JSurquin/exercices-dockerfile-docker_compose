-- AlterTable
ALTER TABLE "Trade" ADD COLUMN "affiliateCommissionProcessedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "AffiliateCommission" ADD COLUMN "tradeId" TEXT,
ADD COLUMN "affiliateCode" TEXT,
ADD COLUMN "commissionRate" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateCommission_tradeId_key" ON "AffiliateCommission"("tradeId");

-- AddForeignKey
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
