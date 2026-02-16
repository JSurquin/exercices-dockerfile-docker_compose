-- Align kyc_document / KycDocument with current Prisma schema in one go.
-- Handles: providerId -> kycaidApplicantId, adds any missing columns and indexes.
-- Idempotent, no data loss.

DO $$
DECLARE
  tbl text;
  col_exists boolean;
  old_col_exists boolean;
BEGIN
  -- Resolve table name (KycDocument or kyc_document)
  SELECT tablename INTO tbl
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename IN ('KycDocument', 'kyc_document')
  LIMIT 1;

  IF tbl IS NULL THEN
    RETURN;
  END IF;

  -- 1) kycaidApplicantId: rename from providerId or add
  SELECT EXISTS (
    SELECT 1 FROM pg_attribute a
    JOIN pg_class c ON a.attrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = tbl
      AND a.attname = 'kycaidApplicantId' AND a.attnum > 0 AND NOT a.attisdropped
  ) INTO col_exists;
  SELECT EXISTS (
    SELECT 1 FROM pg_attribute a
    JOIN pg_class c ON a.attrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = tbl
      AND a.attname = 'providerId' AND a.attnum > 0 AND NOT a.attisdropped
  ) INTO old_col_exists;

  IF NOT col_exists AND old_col_exists THEN
    EXECUTE format('ALTER TABLE "public"."%I" RENAME COLUMN "providerId" TO "kycaidApplicantId"', tbl);
  ELSIF NOT col_exists AND NOT old_col_exists THEN
    EXECUTE format('ALTER TABLE "public"."%I" ADD COLUMN "kycaidApplicantId" TEXT', tbl);
  END IF;

  -- 2) kycaidDocumentId
  EXECUTE format('ALTER TABLE "public"."%I" ADD COLUMN IF NOT EXISTS "kycaidDocumentId" TEXT', tbl);

  -- 3) verificationId (might already exist from 20241219)
  EXECUTE format('ALTER TABLE "public"."%I" ADD COLUMN IF NOT EXISTS "verificationId" TEXT', tbl);

  -- 4) isVerified
  EXECUTE format('ALTER TABLE "public"."%I" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false', tbl);

  -- 5) verifiedAt
  EXECUTE format('ALTER TABLE "public"."%I" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3)', tbl);

  -- 6) metadata (might already exist from 20241219)
  EXECUTE format('ALTER TABLE "public"."%I" ADD COLUMN IF NOT EXISTS "metadata" JSONB', tbl);
END $$;

-- Indexes (idempotent: IF NOT EXISTS). Table might be KycDocument or kyc_document.
DO $$
DECLARE
  tbl text;
BEGIN
  SELECT tablename INTO tbl
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename IN ('KycDocument', 'kyc_document')
  LIMIT 1;
  IF tbl IS NULL THEN RETURN; END IF;

  EXECUTE format('CREATE INDEX IF NOT EXISTS "kyc_document_kycaidApplicantId_idx" ON "public"."%I"("kycaidApplicantId")', tbl);
  EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS "kyc_document_kycaidDocumentId_key" ON "public"."%I"("kycaidDocumentId")', tbl);
  EXECUTE format('CREATE INDEX IF NOT EXISTS "kyc_document_kycaidDocumentId_idx" ON "public"."%I"("kycaidDocumentId")', tbl);
  EXECUTE format('CREATE INDEX IF NOT EXISTS "kyc_document_verificationId_idx" ON "public"."%I"("verificationId")', tbl);
END $$;
