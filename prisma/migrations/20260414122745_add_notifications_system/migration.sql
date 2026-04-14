-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('TRADE_UPDATE', 'PAYOUT_UPDATE', 'KYC_UPDATE', 'GIVEAWAY_WIN', 'MISSION_COMPLETED', 'LEVEL_UP', 'ADMIN_MESSAGE', 'SYSTEM_ANNOUNCEMENT', 'SECURITY_ALERT');

-- CreateEnum
CREATE TYPE "public"."NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "public"."notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "priority" "public"."NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "titleFr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "messageFr" TEXT NOT NULL,
    "messageEn" TEXT NOT NULL,
    "titleCn" TEXT,
    "messageCn" TEXT,
    "link" TEXT,
    "metadata" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT false,
    "tradeAlerts" BOOLEAN NOT NULL DEFAULT true,
    "payoutAlerts" BOOLEAN NOT NULL DEFAULT true,
    "kycAlerts" BOOLEAN NOT NULL DEFAULT true,
    "giveawayAlerts" BOOLEAN NOT NULL DEFAULT true,
    "missionAlerts" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "securityAlerts" BOOLEAN NOT NULL DEFAULT true,
    "systemAnnouncements" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_userId_read_idx" ON "public"."notification"("userId", "read");

-- CreateIndex
CREATE INDEX "notification_userId_createdAt_idx" ON "public"."notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "notification_type_idx" ON "public"."notification"("type");

-- CreateIndex
CREATE INDEX "notification_priority_idx" ON "public"."notification"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "public"."notification_preferences"("userId");

-- AddForeignKey
ALTER TABLE "public"."notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
