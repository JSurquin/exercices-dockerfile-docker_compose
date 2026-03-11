/*
  Warnings:

  - You are about to drop the `payout_auto_approve_user_settings` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."PointEventType" AS ENUM ('TRADE_SALE', 'DAILY_LOGIN', 'LEVEL_UP', 'ADMIN_ADJUSTMENT', 'GIVEAWAY_ENTRY', 'REFERRAL_BONUS');

-- DropForeignKey
ALTER TABLE "public"."payout_auto_approve_user_settings" DROP CONSTRAINT "payout_auto_approve_user_settings_userId_fkey";

-- DropTable
DROP TABLE "public"."payout_auto_approve_user_settings";

-- CreateTable
CREATE TABLE "public"."point_transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."PointEventType" NOT NULL,
    "points" INTEGER NOT NULL,
    "tickets" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."daily_login" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loginDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "streak" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "daily_login_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "point_transaction_userId_idx" ON "public"."point_transaction"("userId");

-- CreateIndex
CREATE INDEX "point_transaction_type_idx" ON "public"."point_transaction"("type");

-- CreateIndex
CREATE INDEX "point_transaction_createdAt_idx" ON "public"."point_transaction"("createdAt");

-- CreateIndex
CREATE INDEX "daily_login_userId_idx" ON "public"."daily_login"("userId");

-- CreateIndex
CREATE INDEX "daily_login_loginDate_idx" ON "public"."daily_login"("loginDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_login_userId_loginDate_key" ON "public"."daily_login"("userId", "loginDate");

-- AddForeignKey
ALTER TABLE "public"."point_transaction" ADD CONSTRAINT "point_transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_login" ADD CONSTRAINT "daily_login_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
