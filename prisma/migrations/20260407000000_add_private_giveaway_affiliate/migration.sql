-- Add private giveaway support with affiliate access control
ALTER TABLE "Giveaway"
  ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "requiredAffiliateCode" TEXT;

CREATE INDEX IF NOT EXISTS "Giveaway_isPrivate_idx" ON "Giveaway"("isPrivate");
