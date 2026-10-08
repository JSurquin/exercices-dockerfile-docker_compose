import { NextRequest, NextResponse } from 'next/server';
import { requireUserSession } from '@/lib/require-session-user';
import { safeParseJson } from '@/lib/validation/helpers';
import { reviewPromptBodySchema } from '@/lib/validation/schemas/user';
import { recordReviewPromptAction } from '@/lib/review-prompt';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await requireUserSession(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    let raw: unknown = {};
    try {
      raw = await request.json();
    } catch {
      raw = {};
    }

    const parsed = safeParseJson(raw, reviewPromptBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    const { action, trigger } = parsed.data;
    await recordReviewPromptAction(session.user.id, action, trigger);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Erreur lors de l\'enregistrement du bandeau Trustpilot', {
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    });
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
