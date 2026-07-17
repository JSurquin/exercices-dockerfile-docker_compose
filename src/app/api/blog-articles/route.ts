import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { pickLocalizedField, pickLocalizedOptionalField, resolveCmsLocale } from '@/lib/cms-localized';
import { isBlogCategoryKey } from '@/lib/blog-articles-config';
import { normalizeCmsImageUrl } from '@/lib/cms-image-url';

/**
 * GET /api/blog-articles
 * Liste publique des articles blog publiés
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = resolveCmsLocale(request, searchParams.get('lang'));
    const category = searchParams.get('category');
    const featuredOnly = searchParams.get('featured') === 'true';

    const articles = await prisma.blogArticle.findMany({
      where: {
        isPublished: true,
        ...(category && isBlogCategoryKey(category) ? { category } : {}),
        ...(featuredOnly ? { isFeatured: true } : {}),
      },
      orderBy: [{ publishedAt: 'desc' }, { sortOrder: 'asc' }],
      select: {
        id: true,
        slug: true,
        titleFr: true,
        titleEn: true,
        titleCn: true,
        summaryFr: true,
        summaryEn: true,
        summaryCn: true,
        category: true,
        coverImageUrl: true,
        readTimeMinutes: true,
        isFeatured: true,
        publishedAt: true,
        updatedAt: true,
      },
    });

    const localized = articles.map((article) => ({
      id: article.id,
      slug: article.slug,
      title: pickLocalizedField(lang, article.titleFr, article.titleEn, article.titleCn),
      summary: pickLocalizedOptionalField(
        lang,
        article.summaryFr,
        article.summaryEn,
        article.summaryCn,
      ),
      category: article.category,
      coverImageUrl: normalizeCmsImageUrl(article.coverImageUrl),
      readTimeMinutes: article.readTimeMinutes,
      isFeatured: article.isFeatured,
      publishedAt: article.publishedAt,
      updatedAt: article.updatedAt,
    }));

    return NextResponse.json({ articles: localized });
  } catch (error) {
    console.error('Error fetching blog articles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
