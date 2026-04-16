-- AlterTable
ALTER TABLE "public"."Trade" ADD COLUMN     "affiliatePromoBonusCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "affiliatePromoCode" TEXT,
ADD COLUMN     "affiliatePromoFragmentsGrantedAt" TIMESTAMP(3);
