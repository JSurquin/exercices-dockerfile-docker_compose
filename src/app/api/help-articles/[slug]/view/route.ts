import { NextRequest, NextResponse } from 'next/server';
import { incrementHelpArticleView } from '@/lib/help-articles-server';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * POST /api/help-articles/[slug]/view
 * Incrémente le compteur de vues d'un article d'aide
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const viewCount = await incrementHelpArticleView(slug);
    return NextResponse.json({ viewCount });
  } catch (error) {
    if (error instanceof Error && error.message === 'Article not found') {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    console.error('Error recording help article view:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
