import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';

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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
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
        titleFr: titleFr ?? existingPage.titleFr,
        titleEn: titleEn ?? existingPage.titleEn,
        titleCn: titleCn !== undefined ? titleCn : existingPage.titleCn,
        subtitleFr: subtitleFr ?? existingPage.subtitleFr,
        subtitleEn: subtitleEn ?? existingPage.subtitleEn,
        subtitleCn: subtitleCn !== undefined ? subtitleCn : existingPage.subtitleCn,
        contentFr: contentFr ?? existingPage.contentFr,
        contentEn: contentEn ?? existingPage.contentEn,
        contentCn: contentCn !== undefined ? contentCn : existingPage.contentCn,
        contactEmail: contactEmail ?? existingPage.contactEmail,
        contactPhone: contactPhone ?? existingPage.contactPhone,
        isPublished: isPublished ?? existingPage.isPublished,
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
        changeReason: changeReason || 'Mise à jour',
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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== 'ADMIN') {
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

