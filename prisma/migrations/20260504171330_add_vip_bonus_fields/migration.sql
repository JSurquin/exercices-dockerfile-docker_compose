-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "vipBonusCents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "bonusRatePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "userTag" TEXT;
