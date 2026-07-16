import { NextRequest, NextResponse } from 'next/server';
import { resolveCmsLocale } from '@/lib/cms-localized';
import { getHelpArticleBySlug } from '@/lib/help-articles-server';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/help-articles/[slug]
 * Récupère un article d'aide public par slug (statique ou CMS)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const lang = resolveCmsLocale(request, searchParams.get('lang'));

    const article = await getHelpArticleBySlug(slug, lang);

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ article: { ...article, lang } });
  } catch (error) {
    console.error('Error fetching help article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
