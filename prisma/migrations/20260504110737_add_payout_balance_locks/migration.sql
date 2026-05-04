-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "balanceDebitedAt" TIMESTAMP(3),
ADD COLUMN     "balanceFrozenAt" TIMESTAMP(3);
