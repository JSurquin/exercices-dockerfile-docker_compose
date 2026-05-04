-- Insert a withdrawal_limit record (5000€ = 500000 cents) for all existing users
-- who do not already have one. This ensures the default cap is enforced.
INSERT INTO "withdrawal_limit" ("id", "userId", "monthlyLimitCents", "updatedBy", "updatedAt")
SELECT
  gen_random_uuid()::text,
  u."id",
  500000,
  NULL,
  NOW()
FROM "user" u
LEFT JOIN "withdrawal_limit" wl ON wl."userId" = u."id"
WHERE wl."id" IS NULL;
