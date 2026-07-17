import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { pickLocalizedField, pickLocalizedOptionalField, resolveCmsLocale } from '@/lib/cms-localized';
import { normalizeCmsImageUrl } from '@/lib/cms-image-url';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/blog-articles/[slug]
 * Récupère un article blog public par slug
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const lang = resolveCmsLocale(request, searchParams.get('lang'));

    const article = await prisma.blogArticle.findFirst({
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
        category: true,
        coverImageUrl: true,
        readTimeMinutes: true,
        isFeatured: true,
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
        category: article.category,
        coverImageUrl: normalizeCmsImageUrl(article.coverImageUrl),
        readTimeMinutes: article.readTimeMinutes,
        isFeatured: article.isFeatured,
        publishedAt: article.publishedAt,
        updatedAt: article.updatedAt,
        lang,
      },
    });
  } catch (error) {
    console.error('Error fetching blog article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
