-- CreateEnum: BalanceTransactionType (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BalanceTransactionType') THEN
    CREATE TYPE "public"."BalanceTransactionType" AS ENUM ('TRADE_CREDIT', 'ADMIN_ADJUSTMENT', 'WITHDRAWAL', 'PAYOUT_REFUND', 'FROZEN', 'UNFROZEN');
  END IF;
END $$;

-- AlterEnum: Add CANCELLED to PayoutStatus (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'PayoutStatus' AND e.enumlabel = 'CANCELLED'
  ) THEN
    ALTER TYPE "public"."PayoutStatus" ADD VALUE 'CANCELLED';
  END IF;
END $$;

-- AlterTable: Add balance fields to user (idempotent)
ALTER TABLE "public"."user" ADD COLUMN IF NOT EXISTS "balanceCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "public"."user" ADD COLUMN IF NOT EXISTS "frozenBalanceCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "public"."user" ADD COLUMN IF NOT EXISTS "accountFrozen" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: balance_transaction (idempotent)
CREATE TABLE IF NOT EXISTS "public"."balance_transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BalanceTransactionType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "balanceAfterCents" INTEGER NOT NULL,
    "reason" TEXT,
    "createdBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable: withdrawal_limit (idempotent)
CREATE TABLE IF NOT EXISTS "public"."withdrawal_limit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monthlyLimitCents" INTEGER NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawal_limit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: balance_transaction (idempotent)
CREATE INDEX IF NOT EXISTS "balance_transaction_userId_idx" ON "public"."balance_transaction"("userId");
CREATE INDEX IF NOT EXISTS "balance_transaction_createdAt_idx" ON "public"."balance_transaction"("createdAt");
CREATE INDEX IF NOT EXISTS "balance_transaction_type_idx" ON "public"."balance_transaction"("type");

-- CreateIndex: withdrawal_limit unique (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "withdrawal_limit_userId_key" ON "public"."withdrawal_limit"("userId");

-- AddForeignKey (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'balance_transaction_userId_fkey') THEN
    ALTER TABLE "public"."balance_transaction" ADD CONSTRAINT "balance_transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'withdrawal_limit_userId_fkey') THEN
    ALTER TABLE "public"."withdrawal_limit" ADD CONSTRAINT "withdrawal_limit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
