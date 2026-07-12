import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireCronSecret } from '@/lib/cron-auth';
import { runAutoCloseInactiveConversationsJob } from '@/lib/cron-jobs/auto-close-inactive-conversations';

function isCronAuthorized(req: NextRequest): { ok: true } | { ok: false; status: number; message: string } {
  const r = requireCronSecret(req);
  if (r.ok) {
    return { ok: true };
  }
  const legacy = process.env.CRON_SECRET_TOKEN;
  const bearer = req.headers.get('authorization');
  if (legacy && bearer === `Bearer ${legacy}`) {
    return { ok: true };
  }
  return r;
}

async function handleAutoCloseInactiveConversations(req: NextRequest): Promise<NextResponse> {
  try {
    const cronAuth = isCronAuthorized(req);
    if (!cronAuth.ok) {
      logger.warn('Unauthorized cron access attempt', {
        ip: req.headers.get('x-forwarded-for') || 'Unknown',
        userAgent: req.headers.get('user-agent'),
      });
      return NextResponse.json({ error: cronAuth.message }, { status: cronAuth.status });
    }

    const result = await runAutoCloseInactiveConversationsJob();
    return NextResponse.json(result, {
      status: result.success ? 200 : 207,
    });
  } catch (error) {
    logger.error('Auto-close inactive conversations failed', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Auto-close inactive conversations failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export const POST = handleAutoCloseInactiveConversations;
export const GET = handleAutoCloseInactiveConversations;
export const PUT = () => NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
export const DELETE = () => NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
