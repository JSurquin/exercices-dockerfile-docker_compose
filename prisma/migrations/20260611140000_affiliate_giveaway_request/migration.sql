-- CreateEnum
CREATE TYPE "public"."AffiliateGiveawayRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "public"."BalanceTransactionType" ADD VALUE 'AFFILIATE_GIVEAWAY';

-- CreateTable
CREATE TABLE "public"."affiliate_giveaway_request" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "winnerCount" INTEGER NOT NULL,
    "costCents" INTEGER NOT NULL,
    "adminMessage" TEXT,
    "status" "public"."AffiliateGiveawayRequestStatus" NOT NULL DEFAULT 'PENDING',
    "giveawayId" TEXT,
    "prize" TEXT,
    "prizeImageUrl" TEXT,
    "steamMarketHashName" TEXT,
    "rewardValueCents" INTEGER,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_giveaway_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_giveaway_request_giveawayId_key" ON "public"."affiliate_giveaway_request"("giveawayId");

-- CreateIndex
CREATE INDEX "affiliate_giveaway_request_affiliateId_idx" ON "public"."affiliate_giveaway_request"("affiliateId");

-- CreateIndex
CREATE INDEX "affiliate_giveaway_request_userId_idx" ON "public"."affiliate_giveaway_request"("userId");

-- CreateIndex
CREATE INDEX "affiliate_giveaway_request_status_idx" ON "public"."affiliate_giveaway_request"("status");

-- CreateIndex
CREATE INDEX "affiliate_giveaway_request_createdAt_idx" ON "public"."affiliate_giveaway_request"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."affiliate_giveaway_request" ADD CONSTRAINT "affiliate_giveaway_request_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "public"."AffiliateStats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."affiliate_giveaway_request" ADD CONSTRAINT "affiliate_giveaway_request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."affiliate_giveaway_request" ADD CONSTRAINT "affiliate_giveaway_request_giveawayId_fkey" FOREIGN KEY ("giveawayId") REFERENCES "public"."Giveaway"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."affiliate_giveaway_request" ADD CONSTRAINT "affiliate_giveaway_request_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
