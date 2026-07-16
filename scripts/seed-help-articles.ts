/**
 * Seed des articles d'aide CMS à partir des articles statiques i18n + enrichissement RAG.
 * Usage : pnpm tsx scripts/seed-help-articles.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { STATIC_HELP_ARTICLES } from '../src/lib/help-articles-config';
import { getMessages } from '../src/lib/i18n';
import {
  EXTRA_HELP_ARTICLES,
  buildHelpArticleContent,
  getExtraHelpArticleContent,
} from '../src/lib/help-articles-rag-enrichment';

const prisma = new PrismaClient();

type ArticleBodies = Record<string, Record<string, string>>;
type ArticleTitles = Record<string, Record<string, string>>;

function getTexts(
  locale: 'fr' | 'en' | 'cn',
  categoryKey: string,
  titleKey: string,
  bodyKey: string,
) {
  const t = getMessages(locale).helpPage;
  const titles = t.articles as ArticleTitles;
  const bodies = t.articleBodies as ArticleBodies;
  return {
    title: titles[categoryKey]?.[titleKey] ?? titleKey,
    body: bodies[categoryKey]?.[bodyKey] ?? '',
  };
}

async function main() {
  console.log('🌱 Seed des articles d\'aide CMS...\n');

  const allDefs = [
    ...STATIC_HELP_ARTICLES.map((def) => ({ ...def, extra: false as const })),
    ...EXTRA_HELP_ARTICLES.map((a) => ({ ...a, extra: true as const })),
  ];

  let created = 0;
  let updated = 0;

  for (const def of allDefs) {
    let fr: { title: string; body: string };
    let en: { title: string; body: string };
    let cn: { title: string; body: string };

    if (def.extra) {
      fr = { title: def.titleFr, body: def.contentFr };
      en = { title: def.titleEn, body: def.contentEn };
      cn = { title: def.titleCn, body: def.contentCn };
    } else {
      fr = getTexts('fr', def.categoryKey, def.titleKey, def.bodyKey);
      en = getTexts('en', def.categoryKey, def.titleKey, def.bodyKey);
      cn = getTexts('cn', def.categoryKey, def.titleKey, def.bodyKey);
    }

    const contentFr = def.extra
      ? getExtraHelpArticleContent(def.slug, 'fr') ?? fr.body
      : buildHelpArticleContent(fr.body, def.slug, 'fr');
    const contentEn = def.extra
      ? getExtraHelpArticleContent(def.slug, 'en') ?? en.body
      : buildHelpArticleContent(en.body, def.slug, 'en');
    const contentCn = def.extra
      ? getExtraHelpArticleContent(def.slug, 'cn') ?? cn.body
      : buildHelpArticleContent(cn.body, def.slug, 'cn');

    const existing = await prisma.helpArticle.findUnique({ where: { slug: def.slug } });

    if (existing) {
      await prisma.helpArticle.update({
        where: { slug: def.slug },
        data: {
          titleFr: fr.title,
          titleEn: en.title,
          titleCn: cn.title,
          contentFr,
          contentEn,
          contentCn: contentCn || null,
          category: def.categoryKey,
          sortOrder: def.sortOrder,
          isPublished: true,
        },
      });
      updated++;
      console.log(`  ♻️  Mis à jour : ${def.slug}`);
    } else {
      await prisma.helpArticle.create({
        data: {
          slug: def.slug,
          titleFr: fr.title,
          titleEn: en.title,
          titleCn: cn.title,
          contentFr,
          contentEn,
          contentCn: contentCn || null,
          category: def.categoryKey,
          sortOrder: def.sortOrder,
          isPublished: true,
        },
      });
      created++;
      console.log(`  ✅ Créé : ${def.slug}`);
    }
  }

  // Stats initiales pour articles populaires (si absentes)
  const seedStats: Array<{ slug: string; viewCount: number; helpfulYes: number; helpfulNo: number }> = [
    { slug: 'how-to-sell', viewCount: 5200, helpfulYes: 4992, helpfulNo: 208 },
    { slug: 'sell-multiple-steam-accounts', viewCount: 1800, helpfulYes: 1710, helpfulNo: 90 },
    { slug: 'kyc-step-by-step', viewCount: 4100, helpfulYes: 3854, helpfulNo: 246 },
    { slug: 'fees', viewCount: 3800, helpfulYes: 3458, helpfulNo: 342 },
    { slug: 'scam', viewCount: 2100, helpfulYes: 1995, helpfulNo: 105 },
    { slug: 'trade-hold', viewCount: 2900, helpfulYes: 2755, helpfulNo: 145 },
    { slug: 'payment-methods', viewCount: 2400, helpfulYes: 2280, helpfulNo: 120 },
  ];

  for (const stat of seedStats) {
    await prisma.helpArticleStat.upsert({
      where: { slug: stat.slug },
      create: stat,
      update: {},
    });
  }

  console.log(`\n✅ ${created} créés, ♻️ ${updated} mis à jour`);
  console.log(`📊 ${seedStats.length} stats initialisées`);
}

main()
  .catch((err) => {
    console.error('Erreur seed help articles:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
