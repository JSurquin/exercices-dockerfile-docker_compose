-- CreateTable
CREATE TABLE "help_article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleFr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleCn" TEXT,
    "subtitleFr" TEXT,
    "subtitleEn" TEXT,
    "subtitleCn" TEXT,
    "contentFr" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "contentCn" TEXT,
    "category" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "help_article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "press_article" (
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
    "sourceName" TEXT,
    "externalUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "press_article_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "help_article_slug_key" ON "help_article"("slug");

-- CreateIndex
CREATE INDEX "help_article_slug_idx" ON "help_article"("slug");

-- CreateIndex
CREATE INDEX "help_article_isPublished_idx" ON "help_article"("isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "press_article_slug_key" ON "press_article"("slug");

-- CreateIndex
CREATE INDEX "press_article_slug_idx" ON "press_article"("slug");

-- CreateIndex
CREATE INDEX "press_article_isPublished_idx" ON "press_article"("isPublished");

-- CreateIndex
CREATE INDEX "press_article_publishedAt_idx" ON "press_article"("publishedAt");

-- Seed default API scam help article
INSERT INTO "help_article" (
    "id", "slug", "titleFr", "titleEn", "subtitleFr", "subtitleEn",
    "contentFr", "contentEn", "category", "isPublished", "sortOrder", "updatedAt"
) VALUES (
    'help_scam_default',
    'scam',
    'API scam Steam : comment s''en protéger',
    'Steam API scam: how to protect yourself',
    'Reconnaître et éviter les arnaques API sur Steam',
    'Recognize and avoid API scams on Steam',
    E'# API scam Steam\n\nUn **API scam** est une arnaque où un site malveillant a obtenu votre clé API Steam.\n\n## Signes d''un API scam\n\n- Votre offre de trade est annulée puis remplacée par une autre vers un compte similaire\n- Le Steam ID du bot ne correspond pas à celui affiché sur MoonSkin\n- La photo de profil et le pseudo sont copiés, mais l''identifiant Steam est différent\n\n## Comment vérifier le bot MoonSkin\n\nAvant d''accepter un trade, vérifiez toujours :\n\n- Le **Steam ID** exact\n- La **photo de profil**\n- Le **pseudo**\n\n## Que faire si vous êtes victime\n\n1. Ne paniquez pas\n2. Tentez un reverse trade pour récupérer vos skins\n3. Changez votre mot de passe Steam\n4. Révoquez les clés API sur [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey)\n5. Contactez notre support si vous avez besoin d''aide',
    E'# Steam API scam\n\nAn **API scam** is a fraud where a malicious site obtained your Steam API key.\n\n## Signs of an API scam\n\n- Your trade offer is cancelled and replaced with another to a similar-looking account\n- The bot''s Steam ID does not match the one shown on MoonSkin\n- Profile picture and username are copied, but the Steam ID is different\n\n## How to verify the MoonSkin bot\n\nBefore accepting a trade, always verify:\n\n- The exact **Steam ID**\n- The **profile picture**\n- The **username**\n\n## What to do if you are a victim\n\n1. Don''t panic\n2. Try a reverse trade to recover your skins\n3. Change your Steam password\n4. Revoke API keys at [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey)\n5. Contact our support if you need help',
    'security',
    true,
    0,
    CURRENT_TIMESTAMP
);
