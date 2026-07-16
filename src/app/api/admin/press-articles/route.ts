import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import {
  requireAdminOrModeratorSessionWithDbCheck,
  requireAdminSessionWithDbCheck,
} from '@/lib/require-admin';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminLegalPagePostSchema } from '@/lib/validation/schemas/admin-bodies';
import {
  normalizePressArticleContent,
  validatePressArticlePayload,
} from '@/lib/press-article-content';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminOrModeratorSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const articles = await prisma.pressArticle.findMany({
      orderBy: [{ publishedAt: 'desc' }, { sortOrder: 'asc' }],
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Error fetching press articles:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des articles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, adminLegalPagePostSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    const d = parsed.data as Record<string, unknown>;
    const {
      slug,
      titleFr,
      titleEn,
      titleCn,
      contentFr,
      contentEn,
      contentCn,
      isPublished = true,
      sortOrder = 0,
      summaryFr,
      summaryEn,
      summaryCn,
      sourceName,
      externalUrl,
      publishedAt,
    } = d;

    const validationError = validatePressArticlePayload({
      slug: slug != null ? String(slug) : undefined,
      titleFr: titleFr != null ? String(titleFr) : undefined,
      titleEn: titleEn != null ? String(titleEn) : undefined,
      contentFr: contentFr != null ? String(contentFr) : undefined,
      contentEn: contentEn != null ? String(contentEn) : undefined,
      externalUrl: externalUrl != null ? String(externalUrl) : undefined,
      sourceName: sourceName != null ? String(sourceName) : undefined,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const normalizedContent = normalizePressArticleContent({
      contentFr: contentFr != null ? String(contentFr) : undefined,
      contentEn: contentEn != null ? String(contentEn) : undefined,
      contentCn: contentCn != null ? String(contentCn) : undefined,
      summaryFr: summaryFr != null ? String(summaryFr) : undefined,
      summaryEn: summaryEn != null ? String(summaryEn) : undefined,
      summaryCn: summaryCn != null ? String(summaryCn) : undefined,
      externalUrl: externalUrl != null ? String(externalUrl) : undefined,
    });

    const existing = await prisma.pressArticle.findUnique({ where: { slug: String(slug) } });
    if (existing) {
      return NextResponse.json({ error: 'Un article avec ce slug existe déjà' }, { status: 400 });
    }

    const article = await prisma.pressArticle.create({
      data: {
        slug: String(slug),
        titleFr: String(titleFr),
        titleEn: String(titleEn),
        titleCn: titleCn != null ? String(titleCn) : null,
        summaryFr: summaryFr != null ? String(summaryFr) : null,
        summaryEn: summaryEn != null ? String(summaryEn) : null,
        summaryCn: summaryCn != null ? String(summaryCn) : null,
        contentFr: normalizedContent.contentFr,
        contentEn: normalizedContent.contentEn,
        contentCn: normalizedContent.contentCn,
        sourceName: sourceName != null ? String(sourceName) : null,
        externalUrl: externalUrl != null ? String(externalUrl) : null,
        publishedAt: publishedAt ? new Date(String(publishedAt)) : new Date(),
        isPublished: Boolean(isPublished),
        sortOrder: Number(sortOrder) || 0,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error('Error creating press article:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de l\'article' }, { status: 500 });
  }
}
