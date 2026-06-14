import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/cron-auth';
import { runProcessTradesJob } from '@/lib/cron-jobs/process-trades';

/**
 * POST /api/cron/process-trades
 * Cron job pour traiter les trades qui ont terminé leur période de hold.
 * En production : déclenché par Vercel Cron ou un reverse proxy avec CRON_SECRET.
 * En développement : préférer `pnpm cron:worker` (node-cron, sans endpoint HTTP ouvert).
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
