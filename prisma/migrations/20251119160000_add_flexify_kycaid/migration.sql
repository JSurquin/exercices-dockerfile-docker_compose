-- AlterEnum - KycStatus
ALTER TYPE "public"."KycStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE "public"."KycStatus" ADD VALUE IF NOT EXISTS 'KYCAID_PENDING';
ALTER TYPE "public"."KycStatus" ADD VALUE IF NOT EXISTS 'KYCAID_VERIFIED';
ALTER TYPE "public"."KycStatus" ADD VALUE IF NOT EXISTS 'KYCAID_REJECTED';

-- AlterEnum - PaymentMethodType
ALTER TYPE "public"."PaymentMethodType" ADD VALUE IF NOT EXISTS 'CARD';
ALTER TYPE "public"."PaymentMethodType" ADD VALUE IF NOT EXISTS 'FLEXIFY_SEPA';
ALTER TYPE "public"."PaymentMethodType" ADD VALUE IF NOT EXISTS 'FLEXIFY_CARD';

-- AlterEnum - PayoutStatus
ALTER TYPE "public"."PayoutStatus" ADD VALUE IF NOT EXISTS 'FLEXIFY_PENDING';
ALTER TYPE "public"."PayoutStatus" ADD VALUE IF NOT EXISTS 'FLEXIFY_PROCESSING';
ALTER TYPE "public"."PayoutStatus" ADD VALUE IF NOT EXISTS 'FLEXIFY_PAID';
ALTER TYPE "public"."PayoutStatus" ADD VALUE IF NOT EXISTS 'FLEXIFY_FAILED';

-- AlterTable KycDocument
ALTER TABLE "public"."KycDocument" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE "public"."KycDocument" ADD COLUMN IF NOT EXISTS "verificationId" TEXT;

-- AlterTable Payout
ALTER TABLE "public"."Payout" ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;
ALTER TABLE "public"."Payout" ADD COLUMN IF NOT EXISTS "flexifyPayoutId" TEXT;
ALTER TABLE "public"."Payout" ADD COLUMN IF NOT EXISTS "networkFeeCents" INTEGER;
ALTER TABLE "public"."Payout" ADD COLUMN IF NOT EXISTS "processingFeeCents" INTEGER;

-- AlterTable User
ALTER TABLE "public"."user" ADD COLUMN IF NOT EXISTS "kycaidApplicantId" TEXT;

-- CreateIndex (ignore if exists)
CREATE INDEX IF NOT EXISTS "KycDocument_providerId_idx" ON "public"."KycDocument"("providerId");
CREATE INDEX IF NOT EXISTS "KycDocument_verificationId_idx" ON "public"."KycDocument"("verificationId");
CREATE UNIQUE INDEX IF NOT EXISTS "Payout_flexifyPayoutId_key" ON "public"."Payout"("flexifyPayoutId");
CREATE INDEX IF NOT EXISTS "Payout_flexifyPayoutId_idx" ON "public"."Payout"("flexifyPayoutId");
CREATE UNIQUE INDEX IF NOT EXISTS "user_kycaidApplicantId_key" ON "public"."user"("kycaidApplicantId");



