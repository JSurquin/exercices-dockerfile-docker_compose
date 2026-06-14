import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/cron-auth';
import { runProcessTradesJob } from '@/lib/cron-jobs/process-trades';

/**
 * POST /api/cron/process-trades
 * Traite les trades en fin de période de hold (déclenchement manuel via CRON_SECRET).
 * Planification automatique : worker `pnpm cron:worker`.
 */
export async function POST(request: NextRequest) {
  try {
    const cron = requireCronSecret(request);
    if (!cron.ok) {
      return NextResponse.json({ error: cron.message }, { status: cron.status });
    }

    const result = await runProcessTradesJob();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Cron] Fatal error in trade processing:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
