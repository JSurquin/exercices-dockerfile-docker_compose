-- Blocage ciblé des récompenses (anti-abus VIP/merchant référés)
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "affiliateRewardsBlocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "xpRewardsBlocked" BOOLEAN NOT NULL DEFAULT false;
