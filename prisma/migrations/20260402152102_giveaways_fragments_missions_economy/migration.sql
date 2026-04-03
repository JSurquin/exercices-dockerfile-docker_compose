-- CreateEnum
CREATE TYPE "public"."GiveawayDurationType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."FragmentTransactionType" AS ENUM ('GENERATED_SALE', 'GENERATED_MISSION_DAILY', 'GENERATED_MISSION_WEEKLY', 'GENERATED_MISSION_MONTHLY', 'GENERATED_MISSION_SOCIAL', 'GENERATED_MISSION_BONUS', 'GENERATED_LEVEL_TIER', 'GENERATED_EVENT', 'GENERATED_ADMIN', 'SPENT_GIVEAWAY');

-- AlterTable
ALTER TABLE "public"."Giveaway" ADD COLUMN     "durationType" "public"."GiveawayDurationType" NOT NULL DEFAULT 'CUSTOM',
ADD COLUMN     "maxEntriesPerUser" INTEGER,
ADD COLUMN     "rewardValueCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "winnerCount" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "fragments" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."giveaway_winner" (
    "id" TEXT NOT NULL,
    "giveawayId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "giveaway_winner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fragment_transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."FragmentTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fragment_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_mission_completion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionKey" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "rewardFragments" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_mission_completion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "giveaway_winner_giveawayId_idx" ON "public"."giveaway_winner"("giveawayId");

-- CreateIndex
CREATE UNIQUE INDEX "giveaway_winner_giveawayId_userId_key" ON "public"."giveaway_winner"("giveawayId", "userId");

-- CreateIndex
CREATE INDEX "fragment_transaction_userId_idx" ON "public"."fragment_transaction"("userId");

-- CreateIndex
CREATE INDEX "fragment_transaction_type_idx" ON "public"."fragment_transaction"("type");

-- CreateIndex
CREATE INDEX "fragment_transaction_createdAt_idx" ON "public"."fragment_transaction"("createdAt");

-- CreateIndex
CREATE INDEX "user_mission_completion_userId_idx" ON "public"."user_mission_completion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_mission_completion_userId_missionKey_periodKey_key" ON "public"."user_mission_completion"("userId", "missionKey", "periodKey");

-- CreateIndex
CREATE INDEX "Giveaway_durationType_idx" ON "public"."Giveaway"("durationType");

-- AddForeignKey
ALTER TABLE "public"."giveaway_winner" ADD CONSTRAINT "giveaway_winner_giveawayId_fkey" FOREIGN KEY ("giveawayId") REFERENCES "public"."Giveaway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fragment_transaction" ADD CONSTRAINT "fragment_transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_mission_completion" ADD CONSTRAINT "user_mission_completion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
