-- CreateTable
CREATE TABLE "partner_video" (
    "id" TEXT NOT NULL,
    "youtubeVideoUrl" TEXT NOT NULL,
    "youtubeVideoId" TEXT NOT NULL,
    "creatorName" TEXT NOT NULL,
    "subscriberCount" TEXT,
    "avatarUrl" TEXT,
    "youtubeChannelUrl" TEXT,
    "twitterUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_logo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "profileUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_logo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "partner_video_isActive_sortOrder_idx" ON "partner_video"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "partner_logo_isActive_sortOrder_idx" ON "partner_logo"("isActive", "sortOrder");
