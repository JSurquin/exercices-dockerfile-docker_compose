import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { pickLocalizedField, pickLocalizedOptionalField, resolveCmsLocale } from '@/lib/cms-localized';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/help-articles/[slug]
 * Récupère un article d'aide public par slug
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const lang = resolveCmsLocale(request, searchParams.get('lang'));

    const article = await prisma.helpArticle.findFirst({
      where: { slug, isPublished: true },
      select: {
        id: true,
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

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({
      article: {
        id: article.id,
        slug: article.slug,
        title: pickLocalizedField(lang, article.titleFr, article.titleEn, article.titleCn),
        subtitle: pickLocalizedOptionalField(
          lang,
          article.subtitleFr,
          article.subtitleEn,
          article.subtitleCn,
        ),
        content: pickLocalizedField(lang, article.contentFr, article.contentEn, article.contentCn),
        category: article.category,
        updatedAt: article.updatedAt,
        lang,
      },
    });
  } catch (error) {
    console.error('Error fetching help article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
