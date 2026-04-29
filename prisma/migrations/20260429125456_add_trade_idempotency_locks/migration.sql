-- AlterTable
ALTER TABLE "public"."Trade" ADD COLUMN     "balanceCreditedAt" TIMESTAMP(3),
ADD COLUMN     "pendingCreditedAt" TIMESTAMP(3),
ADD COLUMN     "pendingRevertedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."webhook_event" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "handler" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,

    CONSTRAINT "webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "webhook_event_webhookId_handler_key" ON "public"."webhook_event"("webhookId", "handler");
