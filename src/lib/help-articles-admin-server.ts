import { prisma } from '~/prisma/prisma';
import { getMessages } from '@/lib/i18n';
import {
  STATIC_HELP_ARTICLES,
  HELP_CATEGORY_KEYS,
  resolveCategoryKey,
  helpfulPercent,
  type HelpCategoryKey,
} from '@/lib/help-articles-config';
import { EXTRA_HELP_ARTICLES } from '@/lib/help-articles-rag-enrichment';

export interface AdminHelpArticleRecord {
  id: string;
  slug: string;
  titleFr: string;
  titleEn: string;
  titleCn?: string | null;
  subtitleFr?: string | null;
  subtitleEn?: string | null;
  subtitleCn?: string | null;
  contentFr: string;
  contentEn: string;
  contentCn?: string | null;
  category?: string | null;
  categoryKey: HelpCategoryKey;
  isPublished: boolean;
  sortOrder: number;
  updatedAt: string;
  source: 'static' | 'cms';
  viewCount: number;
  helpfulYes: number;
  helpfulNo: number;
  helpfulPercent: number | null;
}

type ArticleBodies = Record<string, Record<string, string>>;
type ArticleTitles = Record<string, Record<string, string>>;

function getStaticTexts(categoryKey: string, titleKey: string, bodyKey: string) {
  const fr = getMessages('fr').helpPage;
  const en = getMessages('en').helpPage;
  const titlesFr = fr.articles as ArticleTitles;
  const titlesEn = en.articles as ArticleTitles;
  const bodiesFr = fr.articleBodies as ArticleBodies;
  const bodiesEn = en.articleBodies as ArticleBodies;
  return {
    titleFr: titlesFr[categoryKey]?.[titleKey] ?? titleKey,
    titleEn: titlesEn[categoryKey]?.[titleKey] ?? titleKey,
    contentFr: bodiesFr[categoryKey]?.[bodyKey] ?? '',
    contentEn: bodiesEn[categoryKey]?.[bodyKey] ?? '',
  };
}

export async function listAdminHelpArticles(): Promise<AdminHelpArticleRecord[]> {
  const cmsArticles = await prisma.helpArticle.findMany({
    orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
  });

  const cmsSlugs = new Set(cmsArticles.map((a) => a.slug));

  const staticDefs = [
    ...STATIC_HELP_ARTICLES.map((def) => ({ ...def, extra: false as const })),
    ...EXTRA_HELP_ARTICLES.map((a) => ({ ...a, extra: true as const })),
  ].filter((def) => !cmsSlugs.has(def.slug));

  const allSlugs = [
    ...cmsArticles.map((a) => a.slug),
    ...staticDefs.map((a) => a.slug),
  ];

  const stats = await prisma.helpArticleStat.findMany({
    where: { slug: { in: allSlugs } },
  });
  const statsMap = new Map(stats.map((s) => [s.slug, s]));

  const cmsRecords: AdminHelpArticleRecord[] = cmsArticles.map((article) => {
    const categoryKey = resolveCategoryKey(article.category);
    const stat = statsMap.get(article.slug);
    const helpfulYes = stat?.helpfulYes ?? 0;
    const helpfulNo = stat?.helpfulNo ?? 0;
    return {
      id: article.id,
      slug: article.slug,
      titleFr: article.titleFr,
      titleEn: article.titleEn,
      titleCn: article.titleCn,
      subtitleFr: article.subtitleFr,
      subtitleEn: article.subtitleEn,
      subtitleCn: article.subtitleCn,
      contentFr: article.contentFr,
      contentEn: article.contentEn,
      contentCn: article.contentCn,
      category: article.category,
      categoryKey,
      isPublished: article.isPublished,
      sortOrder: article.sortOrder,
      updatedAt: article.updatedAt.toISOString(),
      source: 'cms' as const,
      viewCount: stat?.viewCount ?? 0,
      helpfulYes,
      helpfulNo,
      helpfulPercent: helpfulPercent(helpfulYes, helpfulNo),
    };
  });

  const staticRecords: AdminHelpArticleRecord[] = staticDefs.map((def) => {
    const texts = def.extra
      ? {
          titleFr: def.titleFr,
          titleEn: def.titleEn,
          contentFr: def.contentFr,
          contentEn: def.contentEn,
        }
      : getStaticTexts(def.categoryKey, def.titleKey, def.bodyKey);
    const stat = statsMap.get(def.slug);
    const helpfulYes = stat?.helpfulYes ?? 0;
    const helpfulNo = stat?.helpfulNo ?? 0;
    return {
      id: `static-${def.slug}`,
      slug: def.slug,
      titleFr: texts.titleFr,
      titleEn: texts.titleEn,
      contentFr: texts.contentFr,
      contentEn: texts.contentEn,
      category: def.categoryKey,
      categoryKey: def.categoryKey,
      isPublished: true,
      sortOrder: def.sortOrder,
      updatedAt: new Date(0).toISOString(),
      source: 'static' as const,
      viewCount: stat?.viewCount ?? 0,
      helpfulYes,
      helpfulNo,
      helpfulPercent: helpfulPercent(helpfulYes, helpfulNo),
    };
  });

  return [...cmsRecords, ...staticRecords].sort(
    (a, b) =>
      HELP_CATEGORY_KEYS.indexOf(a.categoryKey) - HELP_CATEGORY_KEYS.indexOf(b.categoryKey) ||
      a.sortOrder - b.sortOrder ||
      a.titleFr.localeCompare(b.titleFr),
  );
}

export function groupAdminHelpArticlesByCategory(
  articles: AdminHelpArticleRecord[],
): Array<{ categoryKey: HelpCategoryKey; articles: AdminHelpArticleRecord[] }> {
  return HELP_CATEGORY_KEYS.map((categoryKey) => ({
    categoryKey,
    articles: articles.filter((a) => a.categoryKey === categoryKey),
  })).filter((group) => group.articles.length > 0);
}
