import { prisma } from '~/prisma/prisma';
import { getMessages, type Locale } from '@/lib/i18n';
import {
  STATIC_HELP_ARTICLES,
  getStaticHelpArticle,
  resolveCategoryKey,
  helpfulPercent,
  type HelpCategoryKey,
} from '@/lib/help-articles-config';
import {
  EXTRA_HELP_ARTICLES,
  applyRagEnrichmentIfNeeded,
  buildHelpArticleContent,
  getExtraHelpArticleContent,
} from '@/lib/help-articles-rag-enrichment';

export interface HelpArticleListItem {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  category: string;
  categoryKey: HelpCategoryKey;
  viewCount: number;
  helpfulPercent: number | null;
  sortOrder: number;
  source: 'static' | 'cms';
}

export interface HelpArticleDetail {
  slug: string;
  title: string;
  subtitle?: string;
  content: string;
  category: string;
  categoryKey: HelpCategoryKey;
  viewCount: number;
  helpfulPercent: number | null;
  updatedAt?: string;
  source: 'static' | 'cms';
}

type ArticleBodies = Record<string, Record<string, string>>;
type ArticleTitles = Record<string, Record<string, string>>;

function getStaticTexts(locale: Locale, def: (typeof STATIC_HELP_ARTICLES)[number]) {
  const t = getMessages(locale).helpPage;
  const titles = t.articles as ArticleTitles;
  const bodies = t.articleBodies as ArticleBodies;
  const categoryKey = def.categoryKey;
  return {
    title: titles[categoryKey]?.[def.titleKey] ?? def.slug,
    body: bodies[categoryKey]?.[def.bodyKey] ?? '',
    category: getMessages(locale).help.categories[categoryKey],
    categoryKey,
  };
}

async function fetchStatsMap(slugs: string[]) {
  if (slugs.length === 0) return new Map<string, { viewCount: number; helpfulYes: number; helpfulNo: number }>();
  const stats = await prisma.helpArticleStat.findMany({
    where: { slug: { in: slugs } },
  });
  return new Map(stats.map((s) => [s.slug, s]));
}

function buildListItem(
  slug: string,
  title: string,
  subtitle: string | undefined,
  excerpt: string,
  category: string,
  categoryKey: HelpCategoryKey,
  sortOrder: number,
  source: 'static' | 'cms',
  stat?: { viewCount: number; helpfulYes: number; helpfulNo: number },
): HelpArticleListItem {
  const viewCount = stat?.viewCount ?? 0;
  const helpfulYes = stat?.helpfulYes ?? 0;
  const helpfulNo = stat?.helpfulNo ?? 0;
  return {
    slug,
    title,
    subtitle,
    excerpt,
    category,
    categoryKey,
    viewCount,
    helpfulPercent: helpfulPercent(helpfulYes, helpfulNo),
    sortOrder,
    source,
  };
}

export async function listHelpArticles(locale: Locale): Promise<HelpArticleListItem[]> {
  const cmsArticles = await prisma.helpArticle.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    select: {
      slug: true,
      titleFr: true,
      titleEn: true,
      titleCn: true,
      subtitleFr: true,
      subtitleEn: true,
      subtitleCn: true,
      contentFr: true,
      contentEn: true,
      contentCn: true,
      category: true,
      sortOrder: true,
    },
  });

  const cmsSlugs = new Set(cmsArticles.map((a) => a.slug));

  const staticItemsSource = [
    ...STATIC_HELP_ARTICLES,
    ...EXTRA_HELP_ARTICLES.map((a) => ({
      slug: a.slug,
      categoryKey: a.categoryKey,
      titleKey: a.slug,
      bodyKey: a.slug,
      sortOrder: a.sortOrder,
    })),
  ].filter((def) => !cmsSlugs.has(def.slug));

  const allSlugs = [
    ...staticItemsSource.map((a) => a.slug),
    ...cmsArticles.map((a) => a.slug),
  ];
  const statsMap = await fetchStatsMap(allSlugs);

  const pickField = (fr: string, en: string, cn: string | null) => {
    if (locale === 'cn' && cn) return cn;
    if (locale === 'en') return en;
    return fr;
  };

  const staticItems = staticItemsSource.map((def) => {
    const extra = EXTRA_HELP_ARTICLES.find((a) => a.slug === def.slug);
    if (extra) {
      const title =
        locale === 'cn' ? extra.titleCn : locale === 'en' ? extra.titleEn : extra.titleFr;
      const body = getExtraHelpArticleContent(def.slug, locale) ?? extra.contentFr;
      const category = getMessages(locale).help.categories[extra.categoryKey];
      return buildListItem(
        def.slug,
        title,
        undefined,
        body.slice(0, 200),
        category,
        extra.categoryKey,
        def.sortOrder,
        'static',
        statsMap.get(def.slug),
      );
    }
    const texts = getStaticTexts(locale, def);
    const enrichedBody = applyRagEnrichmentIfNeeded(def.slug, locale, texts.body);
    return buildListItem(
      def.slug,
      texts.title,
      undefined,
      enrichedBody.slice(0, 200),
      texts.category,
      def.categoryKey,
      def.sortOrder,
      'static',
      statsMap.get(def.slug),
    );
  });

  const cmsItems = cmsArticles.map((article) => {
    const title = pickField(article.titleFr, article.titleEn, article.titleCn);
    const subtitle = pickField(
      article.subtitleFr ?? '',
      article.subtitleEn ?? '',
      article.subtitleCn,
    ) || undefined;
    const content = applyRagEnrichmentIfNeeded(
      article.slug,
      locale,
      pickField(article.contentFr, article.contentEn, article.contentCn),
    );
    const categoryKey = resolveCategoryKey(article.category);
    const category =
      getMessages(locale).help.categories[categoryKey] ?? article.category ?? categoryKey;
    return buildListItem(
      article.slug,
      title,
      subtitle,
      content.slice(0, 200),
      category,
      categoryKey,
      article.sortOrder,
      'cms',
      statsMap.get(article.slug),
    );
  });

  return [...staticItems, ...cmsItems].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

export async function getHelpArticleBySlug(
  slug: string,
  locale: Locale,
): Promise<HelpArticleDetail | null> {
  const stat = await prisma.helpArticleStat.findUnique({ where: { slug } });

  const staticDef = getStaticHelpArticle(slug);
  const cmsArticle = await prisma.helpArticle.findFirst({
    where: { slug, isPublished: true },
    select: {
      slug: true,
      titleFr: true,
      titleEn: true,
      titleCn: true,
      subtitleFr: true,
      subtitleEn: true,
      subtitleCn: true,
      contentFr: true,
      contentEn: true,
      contentCn: true,
      category: true,
      updatedAt: true,
    },
  });

  if (cmsArticle) {
    const pickField = (fr: string, en: string, cn: string | null) => {
      if (locale === 'cn' && cn) return cn;
      if (locale === 'en') return en;
      return fr;
    };

    const categoryKey = resolveCategoryKey(cmsArticle.category);
    const category =
      getMessages(locale).help.categories[categoryKey] ?? cmsArticle.category ?? categoryKey;

    return {
      slug: cmsArticle.slug,
      title: pickField(cmsArticle.titleFr, cmsArticle.titleEn, cmsArticle.titleCn),
      subtitle:
        pickField(cmsArticle.subtitleFr ?? '', cmsArticle.subtitleEn ?? '', cmsArticle.subtitleCn) ||
        undefined,
      content: applyRagEnrichmentIfNeeded(
        cmsArticle.slug,
        locale,
        pickField(cmsArticle.contentFr, cmsArticle.contentEn, cmsArticle.contentCn),
      ),
      category,
      categoryKey,
      viewCount: stat?.viewCount ?? 0,
      helpfulPercent: helpfulPercent(stat?.helpfulYes ?? 0, stat?.helpfulNo ?? 0),
      updatedAt: cmsArticle.updatedAt.toISOString(),
      source: 'cms',
    };
  }

  if (staticDef) {
    const texts = getStaticTexts(locale, staticDef);
    return {
      slug,
      title: texts.title,
      content: applyRagEnrichmentIfNeeded(slug, locale, texts.body),
      category: texts.category,
      categoryKey: staticDef.categoryKey,
      viewCount: stat?.viewCount ?? 0,
      helpfulPercent: helpfulPercent(stat?.helpfulYes ?? 0, stat?.helpfulNo ?? 0),
      source: 'static',
    };
  }

  const extra = EXTRA_HELP_ARTICLES.find((a) => a.slug === slug);
  if (extra) {
    const title =
      locale === 'cn' ? extra.titleCn : locale === 'en' ? extra.titleEn : extra.titleFr;
    const content = getExtraHelpArticleContent(slug, locale) ?? extra.contentFr;
    const categoryKey = extra.categoryKey;
    const category = getMessages(locale).help.categories[categoryKey];
    return {
      slug,
      title,
      content,
      category,
      categoryKey,
      viewCount: stat?.viewCount ?? 0,
      helpfulPercent: helpfulPercent(stat?.helpfulYes ?? 0, stat?.helpfulNo ?? 0),
      source: 'static',
    };
  }

  return null;
}

function articleSlugExists(slug: string) {
  return (
    getStaticHelpArticle(slug) ||
    EXTRA_HELP_ARTICLES.some((a) => a.slug === slug)
  );
}

export async function incrementHelpArticleView(slug: string): Promise<number> {
  const articleExists =
    articleSlugExists(slug) ||
    (await prisma.helpArticle.findFirst({ where: { slug, isPublished: true }, select: { slug: true } }));

  if (!articleExists) {
    throw new Error('Article not found');
  }

  const stat = await prisma.helpArticleStat.upsert({
    where: { slug },
    create: { slug, viewCount: 1, helpfulYes: 0, helpfulNo: 0 },
    update: { viewCount: { increment: 1 } },
  });

  return stat.viewCount;
}

export async function recordHelpArticleFeedback(slug: string, helpful: boolean): Promise<void> {
  const articleExists =
    articleSlugExists(slug) ||
    (await prisma.helpArticle.findFirst({ where: { slug, isPublished: true }, select: { slug: true } }));

  if (!articleExists) {
    throw new Error('Article not found');
  }

  await prisma.helpArticleStat.upsert({
    where: { slug },
    create: {
      slug,
      viewCount: 0,
      helpfulYes: helpful ? 1 : 0,
      helpfulNo: helpful ? 0 : 1,
    },
    update: helpful
      ? { helpfulYes: { increment: 1 } }
      : { helpfulNo: { increment: 1 } },
  });
}
