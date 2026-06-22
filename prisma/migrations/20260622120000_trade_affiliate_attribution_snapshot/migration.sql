-- Snapshot du parrain actif au moment de chaque vente (commission figée par trade)
ALTER TABLE "Trade" ADD COLUMN "affiliateAttributionCode" TEXT;

-- Rattrapage : trades existants avec code promo = attribution déjà snapshotée
UPDATE "Trade"
SET "affiliateAttributionCode" = "affiliatePromoCode"
WHERE "affiliatePromoCode" IS NOT NULL AND "affiliateAttributionCode" IS NULL;
