import { NextRequest, NextResponse } from 'next/server';
import { recordHelpArticleFeedback } from '@/lib/help-articles-server';
import { safeParseJson } from '@/lib/validation/helpers';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

const feedbackSchema = z.object({
  helpful: z.boolean(),
});

/**
 * POST /api/help-articles/[slug]/feedback
 * Enregistre si un article a été utile ou non
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const raw = await request.json();
    const parsed = safeParseJson(raw, feedbackSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    await recordHelpArticleFeedback(slug, parsed.data.helpful);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Article not found') {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    console.error('Error recording help article feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
