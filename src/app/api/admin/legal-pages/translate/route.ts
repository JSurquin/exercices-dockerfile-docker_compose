import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { translateLegalPageContent, type SupportedLanguage } from '@/lib/translation';

/**
 * POST /api/admin/legal-pages/translate
 * Traduit automatiquement le contenu d'une page légale
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
    const { title, subtitle, content, sourceLang, targetLang } = body;

    // Validation
    if (!title || !content || !sourceLang || !targetLang) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants: title, content, sourceLang, targetLang' },
        { status: 400 }
      );
    }

    // Valider les langues supportées
    const supportedLangs: SupportedLanguage[] = ['fr', 'en', 'cn'];
    if (!supportedLangs.includes(sourceLang) || !supportedLangs.includes(targetLang)) {
      return NextResponse.json(
        { error: 'Langues non supportées. Langues disponibles: fr, en, cn' },
        { status: 400 }
      );
    }

    // Effectuer la traduction
    const result = await translateLegalPageContent(
      { title, subtitle, content },
      sourceLang as SupportedLanguage,
      targetLang as SupportedLanguage
    );

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 503 }
      );
    }

    return NextResponse.json({
      translation: result,
      sourceLang,
      targetLang,
    });
  } catch (error) {
    console.error('Error translating legal page:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la traduction' },
      { status: 500 }
    );
  }
}

