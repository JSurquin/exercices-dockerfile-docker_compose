-- AlterTable: add instantCreditEnabled to user
ALTER TABLE "user" ADD COLUMN "instantCreditEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: add instantCreditedAt to trade
ALTER TABLE "Trade" ADD COLUMN "instantCreditedAt" TIMESTAMP(3);
