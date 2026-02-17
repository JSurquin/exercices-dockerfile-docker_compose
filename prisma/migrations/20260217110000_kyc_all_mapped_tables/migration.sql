-- =============================================================================
-- KYC: tables avec @@map() jamais créées en migration (kyc_file, kyc_verification, kyc_affiliated_person)
-- + enums manquants. Idempotent.
-- =============================================================================

-- S'assurer que la table KYC document s'appelle kyc_document (pour @@map et FK kyc_file)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'KycDocument') THEN
    ALTER TABLE "public"."KycDocument" RENAME TO "kyc_document";
  END IF;
END $$;

-- CreateEnum: KycFileSide
DO $$ BEGIN
  CREATE TYPE "KycFileSide" AS ENUM ('FRONT', 'BACK', 'SELFIE', 'PROOF');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: KycaidVerificationStatus
DO $$ BEGIN
  CREATE TYPE "KycaidVerificationStatus" AS ENUM ('UNUSED', 'PENDING', 'PROCESSING', 'COMPLETED', 'DECLINED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: AffiliatedRole
DO $$ BEGIN
  CREATE TYPE "AffiliatedRole" AS ENUM ('DIRECTOR', 'UBO', 'LEGAL_REP', 'SHAREHOLDER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable: kyc_file (@@map("kyc_file"))
CREATE TABLE IF NOT EXISTS "kyc_file" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "side" "KycFileSide" NOT NULL,
    "kycaidFileId" TEXT,
    "uploadedToKycaid" BOOLEAN NOT NULL DEFAULT false,
    "localPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedAt" TIMESTAMP(3),

    CONSTRAINT "kyc_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable: kyc_verification (@@map("kyc_verification"))
CREATE TABLE IF NOT EXISTS "kyc_verification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kycaidVerificationId" TEXT NOT NULL,
    "kycaidApplicantId" TEXT NOT NULL,
    "status" "KycaidVerificationStatus" NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "formUrl" TEXT,
    "documentStatus" TEXT,
    "documentVerified" BOOLEAN,
    "facialStatus" TEXT,
    "facialVerified" BOOLEAN,
    "addressStatus" TEXT,
    "addressVerified" BOOLEAN,
    "amlStatus" TEXT,
    "amlVerified" BOOLEAN,
    "declineReasons" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "kyc_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable: kyc_affiliated_person (@@map("kyc_affiliated_person"))
CREATE TABLE IF NOT EXISTS "kyc_affiliated_person" (
    "id" TEXT NOT NULL,
    "companyApplicantId" TEXT NOT NULL,
    "kycaidAffiliatedId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dob" TEXT NOT NULL,
    "nationality" TEXT,
    "residenceCountry" TEXT,
    "role" "AffiliatedRole" NOT NULL,
    "sharePercentage" DOUBLE PRECISION,
    "addressJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_affiliated_person_pkey" PRIMARY KEY ("id")
);

-- Indexes kyc_file
CREATE UNIQUE INDEX IF NOT EXISTS "kyc_file_kycaidFileId_key" ON "kyc_file"("kycaidFileId");
CREATE INDEX IF NOT EXISTS "kyc_file_documentId_idx" ON "kyc_file"("documentId");
CREATE INDEX IF NOT EXISTS "kyc_file_kycaidFileId_idx" ON "kyc_file"("kycaidFileId");

-- Indexes kyc_verification
CREATE UNIQUE INDEX IF NOT EXISTS "kyc_verification_kycaidVerificationId_key" ON "kyc_verification"("kycaidVerificationId");
CREATE INDEX IF NOT EXISTS "kyc_verification_userId_idx" ON "kyc_verification"("userId");
CREATE INDEX IF NOT EXISTS "kyc_verification_kycaidVerificationId_idx" ON "kyc_verification"("kycaidVerificationId");
CREATE INDEX IF NOT EXISTS "kyc_verification_status_idx" ON "kyc_verification"("status");
CREATE INDEX IF NOT EXISTS "kyc_verification_verified_idx" ON "kyc_verification"("verified");

-- Indexes kyc_affiliated_person
CREATE UNIQUE INDEX IF NOT EXISTS "kyc_affiliated_person_kycaidAffiliatedId_key" ON "kyc_affiliated_person"("kycaidAffiliatedId");
CREATE INDEX IF NOT EXISTS "kyc_affiliated_person_companyApplicantId_idx" ON "kyc_affiliated_person"("companyApplicantId");
CREATE INDEX IF NOT EXISTS "kyc_affiliated_person_kycaidAffiliatedId_idx" ON "kyc_affiliated_person"("kycaidAffiliatedId");

-- FKs (only if tables exist and constraints don't exist yet)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'kyc_file_documentId_fkey'
  ) THEN
    ALTER TABLE "kyc_file" ADD CONSTRAINT "kyc_file_documentId_fkey"
      FOREIGN KEY ("documentId") REFERENCES "kyc_document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'kyc_verification_userId_fkey'
  ) THEN
    ALTER TABLE "kyc_verification" ADD CONSTRAINT "kyc_verification_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
