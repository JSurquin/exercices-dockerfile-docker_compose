-- Rename KycDocument -> kyc_document so Prisma @@map("kyc_document") finds the table.
-- In PostgreSQL, migrations created the table as "KycDocument" (PascalCase);
-- the schema expects "kyc_document". Only rename if the old name exists (e.g. prod),
-- so dev DBs that already have kyc_document (e.g. after db push) are unchanged.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'KycDocument'
  ) THEN
    ALTER TABLE "KycDocument" RENAME TO "kyc_document";
  END IF;
END $$;
