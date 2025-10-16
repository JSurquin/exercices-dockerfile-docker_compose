-- CreateEnum
CREATE TYPE "NewsletterStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NewsletterSendStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED');

-- CreateTable
CREATE TABLE "newsletter_subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "unsubscribeToken" TEXT NOT NULL,

    CONSTRAINT "newsletter_subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_campaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "htmlContent" TEXT,
    "status" "NewsletterStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "newsletter_campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_send" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "NewsletterSendStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "newsletter_send_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriber_email_key" ON "newsletter_subscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriber_unsubscribeToken_key" ON "newsletter_subscriber"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "newsletter_subscriber_email_idx" ON "newsletter_subscriber"("email");

-- CreateIndex
CREATE INDEX "newsletter_subscriber_isActive_idx" ON "newsletter_subscriber"("isActive");

-- CreateIndex
CREATE INDEX "newsletter_campaign_status_idx" ON "newsletter_campaign"("status");

-- CreateIndex
CREATE INDEX "newsletter_campaign_scheduledAt_idx" ON "newsletter_campaign"("scheduledAt");

-- CreateIndex
CREATE INDEX "newsletter_send_campaignId_idx" ON "newsletter_send"("campaignId");

-- CreateIndex
CREATE INDEX "newsletter_send_email_idx" ON "newsletter_send"("email");

-- CreateIndex
CREATE INDEX "newsletter_send_status_idx" ON "newsletter_send"("status");

-- AddForeignKey
ALTER TABLE "newsletter_send" ADD CONSTRAINT "newsletter_send_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "newsletter_campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
