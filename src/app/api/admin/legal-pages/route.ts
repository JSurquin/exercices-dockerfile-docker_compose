import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import {
  requireAdminOrModeratorSessionWithDbCheck,
  requireAdminSessionWithDbCheck,
} from '@/lib/require-admin';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminLegalPagePostSchema } from '@/lib/validation/schemas/admin-bodies';

/**
 * GET /api/admin/legal-pages
 * Récupère toutes les pages légales
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminOrModeratorSessionWithDbCheck(request);
    if (!session) {
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
      subtitleFr,
      subtitleEn,
      subtitleCn,
      contentFr,
      contentEn,
      contentCn,
      contactEmail,
      contactPhone,
      isPublished = true,
    } = d;

    // Validation
    if (!slug || !titleFr || !titleEn || !contentFr || !contentEn) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants: slug, titleFr, titleEn, contentFr, contentEn' },
        { status: 400 }
      );
    }

    // Vérifier si le slug existe déjà
    const existing = await prisma.legalPage.findUnique({
      where: { slug: String(slug) },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Une page avec ce slug existe déjà' },
        { status: 400 }
      );
    }

    const legalPage = await prisma.legalPage.create({
      data: {
        slug: String(slug),
        titleFr: String(titleFr),
        titleEn: String(titleEn),
        titleCn: titleCn != null ? String(titleCn) : null,
        subtitleFr: subtitleFr != null ? String(subtitleFr) : null,
        subtitleEn: subtitleEn != null ? String(subtitleEn) : null,
        subtitleCn: subtitleCn != null ? String(subtitleCn) : null,
        contentFr: String(contentFr),
        contentEn: String(contentEn),
        contentCn: contentCn != null ? String(contentCn) : null,
        contactEmail: contactEmail != null ? String(contactEmail) : null,
        contactPhone: contactPhone != null ? String(contactPhone) : null,
        isPublished: Boolean(isPublished),
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

