import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { pickLocalizedField, pickLocalizedOptionalField, resolveCmsLocale } from '@/lib/cms-localized';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/press-articles/[slug]
 * Récupère un article presse public par slug
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const lang = resolveCmsLocale(request, searchParams.get('lang'));

    const article = await prisma.pressArticle.findFirst({
      where: { slug, isPublished: true },
      select: {
        id: true,
        slug: true,
        titleFr: true,
        titleEn: true,
        titleCn: true,
        summaryFr: true,
        summaryEn: true,
        summaryCn: true,
        contentFr: true,
        contentEn: true,
        contentCn: true,
        sourceName: true,
        externalUrl: true,
        publishedAt: true,
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
        summary: pickLocalizedOptionalField(
          lang,
          article.summaryFr,
          article.summaryEn,
          article.summaryCn,
        ),
        content: pickLocalizedField(lang, article.contentFr, article.contentEn, article.contentCn),
        sourceName: article.sourceName,
        externalUrl: article.externalUrl,
        publishedAt: article.publishedAt,
        updatedAt: article.updatedAt,
        lang,
      },
    });
  } catch (error) {
    console.error('Error fetching press article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
