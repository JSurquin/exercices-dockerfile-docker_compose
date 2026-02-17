-- Add all KycDocumentType enum values that the Prisma schema expects.
-- KYCAID returns GOVERNMENT_ID etc.; prod enum was missing these.
-- Idempotent: only adds values that don't exist (works on any PG version).

DO $$
DECLARE
  vals text[] := ARRAY[
    'GOVERNMENT_ID', 'DRIVERS_LICENSE', 'SELFIE_IMAGE', 'ADDRESS_DOCUMENT',
    'DOMESTIC_PASSPORT', 'PERMANENT_RESIDENCE_PERMIT', 'REFUGEE_CARD',
    'FOREIGN_CITIZEN_PASSPORT', 'SELFIE_WITH_DOCUMENT', 'SELFIE_WITH_CREDIT_CARD',
    'FINANCIAL_DOCUMENT', 'TAX_ID_NUMBER', 'CREDIT_CARD', 'BANK_STATEMENT',
    'REGISTRATION_COMPANY', 'COMPANY_LEGAL_ADDRESS', 'AUTHORISED_PERSON',
    'COMPANY_OWNERSHIP', 'VIDEO'
  ];
  v text;
BEGIN
  FOREACH v IN ARRAY vals
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'KycDocumentType' AND e.enumlabel = v
    ) THEN
      EXECUTE format('ALTER TYPE "public"."KycDocumentType" ADD VALUE %L', v);
    END IF;
  END LOOP;
END $$;
