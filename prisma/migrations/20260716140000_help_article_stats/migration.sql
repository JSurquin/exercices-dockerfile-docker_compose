-- CreateTable
CREATE TABLE "help_article_stat" (
    "slug" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "helpfulYes" INTEGER NOT NULL DEFAULT 0,
    "helpfulNo" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "help_article_stat_pkey" PRIMARY KEY ("slug")
);

-- Seed initial stats for popular articles
INSERT INTO "help_article_stat" ("slug", "viewCount", "helpfulYes", "helpfulNo", "updatedAt") VALUES
    ('how-to-sell', 5200, 4992, 208, CURRENT_TIMESTAMP),
    ('kyc-step-by-step', 4100, 3854, 246, CURRENT_TIMESTAMP),
    ('fees', 3800, 3458, 342, CURRENT_TIMESTAMP),
    ('scam', 2100, 1995, 105, CURRENT_TIMESTAMP);
