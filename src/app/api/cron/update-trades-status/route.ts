import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/cron-auth';
import { runUpdateTradesStatusJob } from '@/lib/cron-jobs/update-trades-status';

export async function GET(request: NextRequest) {
  try {
    const cron = requireCronSecret(request);
    if (!cron.ok) {
      return NextResponse.json({ success: false, error: cron.message }, { status: cron.status });
    }

    const result = await runUpdateTradesStatusJob();
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Erreur cron job mise à jour trades:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
