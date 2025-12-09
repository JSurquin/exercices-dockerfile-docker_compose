-- CreateEnum
CREATE TYPE "public"."AffiliateApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."AffiliateApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "motivation" TEXT NOT NULL,
    "socialLinks" JSONB,
    "status" "public"."AffiliateApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AffiliateApplication_userId_idx" ON "public"."AffiliateApplication"("userId");

-- CreateIndex
CREATE INDEX "AffiliateApplication_status_idx" ON "public"."AffiliateApplication"("status");

-- CreateIndex
CREATE INDEX "AffiliateApplication_createdAt_idx" ON "public"."AffiliateApplication"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."AffiliateApplication" ADD CONSTRAINT "AffiliateApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AffiliateApplication" ADD CONSTRAINT "AffiliateApplication_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
