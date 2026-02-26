-- AlterTable
ALTER TABLE "public"."kyc_document" RENAME CONSTRAINT "KycDocument_pkey" TO "kyc_document_pkey";

-- RenameForeignKey
ALTER TABLE "public"."kyc_document" RENAME CONSTRAINT "KycDocument_userId_fkey" TO "kyc_document_userId_fkey";

-- RenameIndex
ALTER INDEX "public"."KycDocument_status_idx" RENAME TO "kyc_document_status_idx";

-- RenameIndex
ALTER INDEX "public"."KycDocument_userId_idx" RENAME TO "kyc_document_userId_idx";
