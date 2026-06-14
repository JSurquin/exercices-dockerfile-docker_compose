import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/cron-auth';
import { runGiveawayDrawJob } from '@/lib/cron-jobs/giveaway-draw';

/**
 * CRON Job pour effectuer automatiquement le tirage des giveaways expirés.
 * En développement : préférer `pnpm cron:worker`.
 */
export async function GET(request: NextRequest) {
  try {
    const cron = requireCronSecret(request);
    if (!cron.ok) {
      return NextResponse.json({ error: cron.message }, { status: cron.status });
    }

    const result = await runGiveawayDrawJob();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[CRON] Erreur lors du tirage automatique:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
