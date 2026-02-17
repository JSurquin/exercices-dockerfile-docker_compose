-- CreateEnum: KycAddressType (manquant, requis par le modèle KycAddress)
DO $$ BEGIN
  CREATE TYPE "KycAddressType" AS ENUM ('REGISTERED', 'BUSINESS', 'ADDITIONAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable: kyc_address (table jamais créée, modèle présent dans le schema Prisma)
CREATE TABLE IF NOT EXISTS "kyc_address" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT,
    "affiliatedPersonId" TEXT,
    "type" "KycAddressType" NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "streetName" TEXT NOT NULL,
    "buildingNumber" TEXT NOT NULL,
    "unitNumber" TEXT,
    "stateOrProvince" TEXT,
    "fullAddress" TEXT,
    "kycaidAddressId" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_address_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "kyc_address_kycaidAddressId_key" ON "kyc_address"("kycaidAddressId");
CREATE INDEX IF NOT EXISTS "kyc_address_applicantId_idx" ON "kyc_address"("applicantId");
CREATE INDEX IF NOT EXISTS "kyc_address_type_idx" ON "kyc_address"("type");
CREATE INDEX IF NOT EXISTS "kyc_address_kycaidAddressId_idx" ON "kyc_address"("kycaidAddressId");
