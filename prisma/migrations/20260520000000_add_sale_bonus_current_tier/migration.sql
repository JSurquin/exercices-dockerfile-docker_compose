-- Migration: add saleBonus and currentTier to User
-- Part of the XP level system (Poussière → Univers)
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "saleBonus" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "currentTier" INTEGER NOT NULL DEFAULT 0;
