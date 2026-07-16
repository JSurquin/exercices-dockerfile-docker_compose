import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import {
  requireAdminOrModeratorSessionWithDbCheck,
  requireAdminSessionWithDbCheck,
} from '@/lib/require-admin';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminLegalPagePatchSchema } from '@/lib/validation/schemas/admin-bodies';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await requireAdminOrModeratorSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const article = await prisma.pressArticle.findUnique({ where: { slug } });
    if (!article) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error fetching press article:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération de l\'article' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, adminLegalPagePatchSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    const body = parsed.data as Record<string, unknown>;
    const existing = await prisma.pressArticle.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
    }

    const updated = await prisma.pressArticle.update({
      where: { slug },
      data: {
        titleFr: (body.titleFr as string | undefined) ?? existing.titleFr,
        titleEn: (body.titleEn as string | undefined) ?? existing.titleEn,
        titleCn: body.titleCn !== undefined ? (body.titleCn as string | null) : existing.titleCn,
        summaryFr: body.summaryFr !== undefined ? (body.summaryFr as string | null) : existing.summaryFr,
        summaryEn: body.summaryEn !== undefined ? (body.summaryEn as string | null) : existing.summaryEn,
        summaryCn: body.summaryCn !== undefined ? (body.summaryCn as string | null) : existing.summaryCn,
        contentFr: (body.contentFr as string | undefined) ?? existing.contentFr,
        contentEn: (body.contentEn as string | undefined) ?? existing.contentEn,
        contentCn: body.contentCn !== undefined ? (body.contentCn as string | null) : existing.contentCn,
        sourceName: body.sourceName !== undefined ? (body.sourceName as string | null) : existing.sourceName,
        externalUrl: body.externalUrl !== undefined ? (body.externalUrl as string | null) : existing.externalUrl,
        publishedAt: body.publishedAt ? new Date(String(body.publishedAt)) : existing.publishedAt,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : existing.sortOrder,
        isPublished: (body.isPublished as boolean | undefined) ?? existing.isPublished,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json({ article: updated });
  } catch (error) {
    console.error('Error updating press article:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'article' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const existing = await prisma.pressArticle.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
    }

    await prisma.pressArticle.delete({ where: { slug } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting press article:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression de l\'article' }, { status: 500 });
  }
}
