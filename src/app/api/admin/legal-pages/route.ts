import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';

/**
 * GET /api/admin/legal-pages
 * Récupère toutes les pages légales
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const legalPages = await prisma.legalPage.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ pages: legalPages });
  } catch (error) {
    console.error('Error fetching legal pages:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des pages légales' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/legal-pages
 * Crée une nouvelle page légale
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const {
      slug,
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
      isPublished = true,
    } = body;

    // Validation
    if (!slug || !titleFr || !titleEn || !contentFr || !contentEn) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants: slug, titleFr, titleEn, contentFr, contentEn' },
        { status: 400 }
      );
    }

    // Vérifier si le slug existe déjà
    const existing = await prisma.legalPage.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Une page avec ce slug existe déjà' },
        { status: 400 }
      );
    }

    const legalPage = await prisma.legalPage.create({
      data: {
        slug,
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
        updatedBy: session.user.id,
      },
    });

    // Créer l'entrée d'historique
    await prisma.legalPageHistory.create({
      data: {
        legalPageId: legalPage.id,
        legalPageSlug: legalPage.slug,
        titleFr: legalPage.titleFr,
        titleEn: legalPage.titleEn,
        titleCn: legalPage.titleCn,
        contentFr: legalPage.contentFr,
        contentEn: legalPage.contentEn,
        contentCn: legalPage.contentCn,
        version: legalPage.version,
        changedBy: session.user.id,
        changeReason: 'Création initiale',
      },
    });

    return NextResponse.json({ page: legalPage }, { status: 201 });
  } catch (error) {
    console.error('Error creating legal page:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la page légale' },
      { status: 500 }
    );
  }
}

