-- CreateEnum
CREATE TYPE "HomePopupStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "home_popup" (
    "id" TEXT NOT NULL,
    "titleFr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleCn" TEXT,
    "messageFr" TEXT NOT NULL,
    "messageEn" TEXT NOT NULL,
    "messageCn" TEXT,
    "ctaUrl" TEXT,
    "ctaLabelFr" TEXT,
    "ctaLabelEn" TEXT,
    "ctaLabelCn" TEXT,
    "status" "HomePopupStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_popup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "home_popup_status_priority_idx" ON "home_popup"("status", "priority");

-- CreateIndex
CREATE INDEX "home_popup_startsAt_endsAt_idx" ON "home_popup"("startsAt", "endsAt");
