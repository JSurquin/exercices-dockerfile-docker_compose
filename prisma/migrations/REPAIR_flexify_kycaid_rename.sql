-- One-time repair: migration folder was renamed so it runs in the right order.
-- 1) 20241219 -> 20251003160000 (after init, fixes P3006)
-- 2) 20251003160000 -> 20251119160000 (after remove_stripe, fixes drift on PaymentMethodType)
-- Run ONCE (no data loss):
--   npx prisma db execute --file prisma/migrations/REPAIR_flexify_kycaid_rename.sql --schema prisma/schema.prisma
UPDATE "_prisma_migrations"
SET migration_name = '20251119160000_add_flexify_kycaid'
WHERE migration_name IN ('20241219_add_flexify_kycaid', '20251003160000_add_flexify_kycaid');
