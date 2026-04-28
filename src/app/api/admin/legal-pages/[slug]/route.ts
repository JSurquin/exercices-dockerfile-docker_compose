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

/**
 * GET /api/admin/legal-pages/[slug]
 * Récupère une page légale par son slug
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await requireAdminOrModeratorSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const legalPage = await prisma.legalPage.findUnique({
      where: { slug },
    });

    if (!legalPage) {
      return NextResponse.json(
        { error: 'Page légale non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({ page: legalPage });
  } catch (error) {
    console.error('Error fetching legal page:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la page légale' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/legal-pages/[slug]
 * Met à jour une page légale
 */
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
    const {
      titleFr,
      titleEn,
      titleCn,
      subtitleFr,
      subtitleEn,
      subtitleCn,
      contentFr,
      contentEn,
      contentCn,
      contactEmail,
      contactPhone,
      isPublished,
      changeReason,
    } = body;

    // Récupérer la page actuelle
    const existingPage = await prisma.legalPage.findUnique({
      where: { slug },
    });

    if (!existingPage) {
      return NextResponse.json(
        { error: 'Page légale non trouvée' },
        { status: 404 }
      );
    }

    // Incrémenter la version
    const versionParts = existingPage.version.split('.');
    const newMinorVersion = parseInt(versionParts[1] || '0') + 1;
    const newVersion = `${versionParts[0]}.${newMinorVersion}`;

    // Mettre à jour la page
    const updatedPage = await prisma.legalPage.update({
      where: { slug },
      data: {
        titleFr: (titleFr as string | undefined) ?? existingPage.titleFr,
        titleEn: (titleEn as string | undefined) ?? existingPage.titleEn,
        titleCn: titleCn !== undefined ? (titleCn as string | null) : existingPage.titleCn,
        subtitleFr: (subtitleFr as string | undefined) ?? existingPage.subtitleFr,
        subtitleEn: (subtitleEn as string | undefined) ?? existingPage.subtitleEn,
        subtitleCn: subtitleCn !== undefined ? (subtitleCn as string | null) : existingPage.subtitleCn,
        contentFr: (contentFr as string | undefined) ?? existingPage.contentFr,
        contentEn: (contentEn as string | undefined) ?? existingPage.contentEn,
        contentCn: contentCn !== undefined ? (contentCn as string | null) : existingPage.contentCn,
        contactEmail: (contactEmail as string | null | undefined) ?? existingPage.contactEmail,
        contactPhone: (contactPhone as string | null | undefined) ?? existingPage.contactPhone,
        isPublished: (isPublished as boolean | undefined) ?? existingPage.isPublished,
        version: newVersion,
        updatedBy: session.user.id,
      },
    });

    // Créer l'entrée d'historique
    await prisma.legalPageHistory.create({
      data: {
        legalPageId: updatedPage.id,
        legalPageSlug: updatedPage.slug,
        titleFr: updatedPage.titleFr,
        titleEn: updatedPage.titleEn,
        titleCn: updatedPage.titleCn,
        contentFr: updatedPage.contentFr,
        contentEn: updatedPage.contentEn,
        contentCn: updatedPage.contentCn,
        version: updatedPage.version,
        changedBy: session.user.id,
        changeReason: (typeof changeReason === 'string' && changeReason) ? changeReason : 'Mise à jour',
      },
    });

    return NextResponse.json({ page: updatedPage });
  } catch (error) {
    console.error('Error updating legal page:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la page légale' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/legal-pages/[slug]
 * Supprime une page légale
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que la page existe
    const existingPage = await prisma.legalPage.findUnique({
      where: { slug },
    });

    if (!existingPage) {
      return NextResponse.json(
        { error: 'Page légale non trouvée' },
        { status: 404 }
      );
    }

    // Supprimer la page (l'historique est conservé pour audit)
    await prisma.legalPage.delete({
      where: { slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting legal page:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la page légale' },
      { status: 500 }
    );
  }
}

