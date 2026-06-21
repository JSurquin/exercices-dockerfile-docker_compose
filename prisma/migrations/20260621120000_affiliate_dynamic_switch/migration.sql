-- AlterTable: track active vs churned referrals
ALTER TABLE "AffiliateReferral" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AffiliateReferral" ADD COLUMN "churnedAt" TIMESTAMP(3);

-- CreateTable: user affiliate history for admin tracking
CREATE TABLE "user_affiliate_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "affiliateCode" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_affiliate_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_affiliate_history_userId_idx" ON "user_affiliate_history"("userId");
CREATE INDEX "user_affiliate_history_affiliateId_idx" ON "user_affiliate_history"("affiliateId");
CREATE INDEX "user_affiliate_history_isActive_idx" ON "user_affiliate_history"("isActive");
CREATE INDEX "user_affiliate_history_startedAt_idx" ON "user_affiliate_history"("startedAt");

ALTER TABLE "user_affiliate_history" ADD CONSTRAINT "user_affiliate_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_affiliate_history" ADD CONSTRAINT "user_affiliate_history_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliateStats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "AffiliateReferral_isActive_idx" ON "AffiliateReferral"("isActive");

-- Backfill history for existing referred users
INSERT INTO "user_affiliate_history" ("id", "userId", "affiliateId", "affiliateCode", "startedAt", "isActive")
SELECT
    gen_random_uuid()::text,
    u."id",
    u."referredByAffiliateId",
    a."code",
    COALESCE(
        (SELECT MIN(ar."createdAt") FROM "AffiliateReferral" ar WHERE ar."referredUserId" = u."id" AND ar."affiliateId" = u."referredByAffiliateId"),
        u."createdAt"
    ),
    true
FROM "user" u
JOIN "AffiliateStats" a ON a."id" = u."referredByAffiliateId"
WHERE u."referredByAffiliateId" IS NOT NULL;
