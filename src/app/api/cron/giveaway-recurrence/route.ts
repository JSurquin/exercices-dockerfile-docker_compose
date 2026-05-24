import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/cron-auth';
import { processDueRecurringGiveaways } from '@/lib/giveaway-recurrence';

/**
 * CRON — génération automatique des instances de giveaways récurrents.
 * À exécuter toutes les 15 minutes (ex. /api/cron/giveaway-recurrence).
 */
export async function GET(request: NextRequest) {
  try {
    const cron = requireCronSecret(request);
    if (!cron.ok) {
      return NextResponse.json({ error: cron.message }, { status: cron.status });
    }

    console.log('[CRON] Traitement des giveaways récurrents...');
    const result = await processDueRecurringGiveaways();
    console.log(`[CRON] Giveaways récurrents : ${result.processedCount} série(s) traitée(s)`);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[CRON] Erreur giveaways récurrents:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
