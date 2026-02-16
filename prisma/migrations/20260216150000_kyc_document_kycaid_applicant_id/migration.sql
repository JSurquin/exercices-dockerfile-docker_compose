-- Add or align kycaidApplicantId on kyc_document / KycDocument.
-- The schema expects "kycaidApplicantId" but production still has "providerId" from init.
-- Idempotent: renames providerId -> kycaidApplicantId when needed; no data loss.

DO $$
DECLARE
  tbl text;
  col_exists boolean;
  old_col_exists boolean;
BEGIN
  -- Resolve table name (could be KycDocument or kyc_document)
  SELECT tablename INTO tbl
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename IN ('KycDocument', 'kyc_document')
  LIMIT 1;

  IF tbl IS NOT NULL THEN
    -- Check if kycaidApplicantId already exists (pg_attribute uses actual column names)
    SELECT EXISTS (
      SELECT 1 FROM pg_attribute a
      JOIN pg_class c ON a.attrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'public' AND c.relname = tbl
        AND a.attname = 'kycaidApplicantId' AND a.attnum > 0 AND NOT a.attisdropped
    ) INTO col_exists;

    -- Check if providerId exists (to rename)
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
      -- Column never existed (edge case): add it as nullable
      EXECUTE format('ALTER TABLE "public"."%I" ADD COLUMN "kycaidApplicantId" TEXT', tbl);
    END IF;
  END IF;
END $$;
