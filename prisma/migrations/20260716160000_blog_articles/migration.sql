-- CreateTable
CREATE TABLE "blog_article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleFr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleCn" TEXT,
    "summaryFr" TEXT,
    "summaryEn" TEXT,
    "summaryCn" TEXT,
    "contentFr" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "contentCn" TEXT,
    "category" TEXT,
    "readTimeMinutes" INTEGER NOT NULL DEFAULT 5,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "blog_article_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blog_article_slug_key" ON "blog_article"("slug");

-- CreateIndex
CREATE INDEX "blog_article_slug_idx" ON "blog_article"("slug");

-- CreateIndex
CREATE INDEX "blog_article_isPublished_idx" ON "blog_article"("isPublished");

-- CreateIndex
CREATE INDEX "blog_article_publishedAt_idx" ON "blog_article"("publishedAt");

-- CreateIndex
CREATE INDEX "blog_article_category_idx" ON "blog_article"("category");
