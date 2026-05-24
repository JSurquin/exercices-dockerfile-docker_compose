-- CreateEnum
CREATE TYPE "GiveawaySeriesStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISABLED');

-- AlterEnum
ALTER TYPE "GiveawayStatus" ADD VALUE IF NOT EXISTS 'PAUSED';
ALTER TYPE "GiveawayStatus" ADD VALUE IF NOT EXISTS 'DISABLED';

-- CreateTable
CREATE TABLE "giveaway_series" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prize" TEXT NOT NULL,
    "prizeImageUrl" TEXT,
    "steamMarketHashName" TEXT,
    "ticketPrice" INTEGER NOT NULL,
    "maxTickets" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "frequency" "GiveawayDurationType" NOT NULL,
    "winnerCount" INTEGER NOT NULL DEFAULT 1,
    "maxEntriesPerUser" INTEGER,
    "rewardValueCents" INTEGER NOT NULL DEFAULT 0,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "requiredAffiliateCode" TEXT,
    "status" "GiveawaySeriesStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "lastSpawnAt" TIMESTAMP(3),
    "nextSpawnAt" TIMESTAMP(3),
    "spawnCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "giveaway_series_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Giveaway" ADD COLUMN "startDate" TIMESTAMP(3),
ADD COLUMN "seriesId" TEXT;

-- CreateIndex
CREATE INDEX "giveaway_series_status_idx" ON "giveaway_series"("status");
CREATE INDEX "giveaway_series_nextSpawnAt_idx" ON "giveaway_series"("nextSpawnAt");
CREATE INDEX "Giveaway_seriesId_idx" ON "Giveaway"("seriesId");

-- AddForeignKey
ALTER TABLE "Giveaway" ADD CONSTRAINT "Giveaway_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "giveaway_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
