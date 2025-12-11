-- CreateTable
CREATE TABLE "public"."legal_page" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleFr" TEXT NOT NULL,
    "subtitleFr" TEXT,
    "contentFr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "subtitleEn" TEXT,
    "contentEn" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "legal_page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."legal_page_history" (
    "id" TEXT NOT NULL,
    "legalPageId" TEXT NOT NULL,
    "legalPageSlug" TEXT NOT NULL,
    "titleFr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "contentFr" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeReason" TEXT,

    CONSTRAINT "legal_page_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."site_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueFr" TEXT,
    "valueEn" TEXT,
    "valueJson" JSONB,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "legal_page_slug_key" ON "public"."legal_page"("slug");

-- CreateIndex
CREATE INDEX "legal_page_slug_idx" ON "public"."legal_page"("slug");

-- CreateIndex
CREATE INDEX "legal_page_isPublished_idx" ON "public"."legal_page"("isPublished");

-- CreateIndex
CREATE INDEX "legal_page_history_legalPageId_idx" ON "public"."legal_page_history"("legalPageId");

-- CreateIndex
CREATE INDEX "legal_page_history_changedAt_idx" ON "public"."legal_page_history"("changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "site_settings_key_key" ON "public"."site_settings"("key");

-- CreateIndex
CREATE INDEX "site_settings_key_idx" ON "public"."site_settings"("key");
