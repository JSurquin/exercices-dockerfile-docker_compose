-- AlterTable
ALTER TABLE "public"."legal_page" ADD COLUMN     "contentCn" TEXT,
ADD COLUMN     "subtitleCn" TEXT,
ADD COLUMN     "titleCn" TEXT;

-- AlterTable
ALTER TABLE "public"."legal_page_history" ADD COLUMN     "contentCn" TEXT,
ADD COLUMN     "titleCn" TEXT;
