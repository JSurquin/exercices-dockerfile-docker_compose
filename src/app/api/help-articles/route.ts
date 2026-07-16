import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { pickLocalizedField, pickLocalizedOptionalField, resolveCmsLocale } from '@/lib/cms-localized';

/**
 * GET /api/help-articles
 * Liste publique des articles d'aide publiés
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = resolveCmsLocale(request, searchParams.get('lang'));

    const articles = await prisma.helpArticle.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        slug: true,
        titleFr: true,
        titleEn: true,
        titleCn: true,
        subtitleFr: true,
        subtitleEn: true,
        subtitleCn: true,
        category: true,
        updatedAt: true,
      },
    });

    const localized = articles.map((article) => ({
      id: article.id,
      slug: article.slug,
      title: pickLocalizedField(lang, article.titleFr, article.titleEn, article.titleCn),
      subtitle: pickLocalizedOptionalField(
        lang,
        article.subtitleFr,
        article.subtitleEn,
        article.subtitleCn,
      ),
      category: article.category,
      updatedAt: article.updatedAt,
    }));

    return NextResponse.json({ articles: localized });
  } catch (error) {
    console.error('Error fetching help articles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
