-- AlterTable: add EUR rate snapshot fields to Trade for financial consistency
ALTER TABLE "Trade" ADD COLUMN "eurCentsAtCredit" INTEGER;
ALTER TABLE "Trade" ADD COLUMN "usdToEurRate" DOUBLE PRECISION;
