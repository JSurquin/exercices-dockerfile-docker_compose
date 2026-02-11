-- AlterEnum: Add WHITEPAY_CRYPTO to PaymentMethodType
ALTER TYPE "public"."PaymentMethodType" ADD VALUE 'WHITEPAY_CRYPTO';

-- AlterEnum: Add Whitepay statuses to PayoutStatus
ALTER TYPE "public"."PayoutStatus" ADD VALUE 'WHITEPAY_WAITING_CONFIRMATION';
ALTER TYPE "public"."PayoutStatus" ADD VALUE 'WHITEPAY_PENDING_WITHDRAWAL';
ALTER TYPE "public"."PayoutStatus" ADD VALUE 'WHITEPAY_PROCESSING_WITHDRAWAL';
ALTER TYPE "public"."PayoutStatus" ADD VALUE 'WHITEPAY_COMPLETE';
ALTER TYPE "public"."PayoutStatus" ADD VALUE 'WHITEPAY_DECLINED';

-- AlterTable: Add Whitepay fields to Payout
ALTER TABLE "public"."Payout" ADD COLUMN "whitepayAddress" TEXT,
ADD COLUMN "whitepayConfirmedAt" TIMESTAMP(3),
ADD COLUMN "whitepayEstimatedAt" TIMESTAMP(3),
ADD COLUMN "whitepayExchangeRate" TEXT,
ADD COLUMN "whitepayFee" TEXT,
ADD COLUMN "whitepayMemo" TEXT,
ADD COLUMN "whitepayNetwork" TEXT,
ADD COLUMN "whitepayStatus" TEXT,
ADD COLUMN "whitepayTargetCurrency" TEXT,
ADD COLUMN "whitepayTargetValue" TEXT,
ADD COLUMN "whitepayTransactionId" TEXT,
ADD COLUMN "whitepayTxHash" TEXT;

-- CreateIndex: Unique constraint on whitepayTransactionId
CREATE UNIQUE INDEX "Payout_whitepayTransactionId_key" ON "public"."Payout"("whitepayTransactionId");

-- CreateIndex: Index for fast lookup by whitepayTransactionId
CREATE INDEX "Payout_whitepayTransactionId_idx" ON "public"."Payout"("whitepayTransactionId");
