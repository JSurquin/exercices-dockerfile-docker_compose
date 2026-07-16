import { NextRequest, NextResponse } from 'next/server';
import { resolveCmsLocale } from '@/lib/cms-localized';
import { listHelpArticles } from '@/lib/help-articles-server';

/**
 * GET /api/help-articles
 * Liste publique des articles d'aide (statiques + CMS) avec stats
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = resolveCmsLocale(request, searchParams.get('lang'));

    const articles = await listHelpArticles(lang);

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Error fetching help articles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
