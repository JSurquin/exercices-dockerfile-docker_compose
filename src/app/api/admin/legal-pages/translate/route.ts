import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { translateLegalPageContent, type SupportedLanguage } from '@/lib/translation';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminLegalPageTranslateRequestSchema } from '@/lib/validation/schemas/admin-bodies';

/**
 * POST /api/admin/legal-pages/translate
 * Traduit automatiquement le contenu d'une page légale
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, adminLegalPageTranslateRequestSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const { title, subtitle, content, sourceLang, targetLang } = parsed.data;

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

