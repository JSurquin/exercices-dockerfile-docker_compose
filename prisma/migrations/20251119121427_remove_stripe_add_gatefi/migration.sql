/*
  Warnings:

  - The values [STRIPE] on the enum `PaymentMethodType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[gateFiOrderId]` on the table `Payout` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."PaymentMethodType_new" AS ENUM ('SEPA', 'CRYPTO');
ALTER TABLE "public"."PaymentMethod" ALTER COLUMN "type" TYPE "public"."PaymentMethodType_new" USING ("type"::text::"public"."PaymentMethodType_new");
ALTER TYPE "public"."PaymentMethodType" RENAME TO "PaymentMethodType_old";
ALTER TYPE "public"."PaymentMethodType_new" RENAME TO "PaymentMethodType";
DROP TYPE "public"."PaymentMethodType_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."Payout" ADD COLUMN     "gateFiOrderId" TEXT,
ADD COLUMN     "gateFiWidgetUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payout_gateFiOrderId_key" ON "public"."Payout"("gateFiOrderId");

-- CreateIndex
CREATE INDEX "Payout_gateFiOrderId_idx" ON "public"."Payout"("gateFiOrderId");
