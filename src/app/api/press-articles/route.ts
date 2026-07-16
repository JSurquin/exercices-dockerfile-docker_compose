import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { pickLocalizedField, pickLocalizedOptionalField, resolveCmsLocale } from '@/lib/cms-localized';

/**
 * GET /api/press-articles
 * Liste publique des articles presse publiés
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = resolveCmsLocale(request, searchParams.get('lang'));

    const articles = await prisma.pressArticle.findMany({
      where: { isPublished: true },
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
        sourceName: true,
        externalUrl: true,
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
      sourceName: article.sourceName,
      externalUrl: article.externalUrl,
      publishedAt: article.publishedAt,
      updatedAt: article.updatedAt,
    }));

    return NextResponse.json({ articles: localized });
  } catch (error) {
    console.error('Error fetching press articles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
