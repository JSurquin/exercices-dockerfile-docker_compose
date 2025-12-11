import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/legal-pages/[slug]
 * Récupère une page légale publique par son slug
 * Retourne le contenu dans la langue demandée via le header Accept-Language ou query param
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    
    // Déterminer la langue demandée (fr, en, cn)
    const langParam = searchParams.get('lang');
    const acceptLanguage = request.headers.get('Accept-Language') || '';
    
    let lang = 'en'; // default
    if (langParam) {
      lang = langParam;
    } else if (acceptLanguage.includes('zh') || acceptLanguage.includes('cn')) {
      lang = 'cn';
    } else if (acceptLanguage.includes('fr')) {
      lang = 'fr';
    }

    const legalPage = await prisma.legalPage.findUnique({
      where: { 
        slug,
        isPublished: true, // Seulement les pages publiées
      },
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
        contactEmail: true,
        contactPhone: true,
        version: true,
        updatedAt: true,
      },
    });

    if (!legalPage) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Fonction pour récupérer le contenu localisé avec fallback
    const getLocalizedContent = (fr: string, en: string, cn: string | null) => {
      if (lang === 'cn' && cn) return cn;
      if (lang === 'fr') return fr;
      return en; // fallback sur anglais
    };

    // Retourner le contenu dans la langue appropriée
    const localizedPage = {
      id: legalPage.id,
      slug: legalPage.slug,
      title: getLocalizedContent(legalPage.titleFr, legalPage.titleEn, legalPage.titleCn),
      subtitle: getLocalizedContent(
        legalPage.subtitleFr || '', 
        legalPage.subtitleEn || '', 
        legalPage.subtitleCn
      ) || undefined,
      content: getLocalizedContent(legalPage.contentFr, legalPage.contentEn, legalPage.contentCn),
      contactEmail: legalPage.contactEmail,
      contactPhone: legalPage.contactPhone,
      version: legalPage.version,
      updatedAt: legalPage.updatedAt,
      lang,
    };

    return NextResponse.json({ page: localizedPage });
  } catch (error) {
    console.error('Error fetching legal page:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

