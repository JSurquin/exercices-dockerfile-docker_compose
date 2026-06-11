-- AlterEnum
ALTER TYPE "BalanceTransactionType" ADD VALUE 'AFFILIATE_COMMISSION';

-- AlterEnum
ALTER TYPE "AffiliateCommissionStatus" ADD VALUE 'CREDITED';

-- AlterTable
ALTER TABLE "AffiliateCommission" ADD COLUMN "balanceCreditedAt" TIMESTAMP(3);
