import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireCronSecret } from '@/lib/cron-auth';
import { runAutoUnassignInactiveConversationsJob } from '@/lib/cron-jobs/auto-unassign-inactive-conversations';

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

async function handleAutoUnassignInactiveConversations(req: NextRequest): Promise<NextResponse> {
  try {
    const cronAuth = isCronAuthorized(req);
    if (!cronAuth.ok) {
      logger.warn('Unauthorized cron access attempt', {
        ip: req.headers.get('x-forwarded-for') || 'Unknown',
        userAgent: req.headers.get('user-agent'),
      });
      return NextResponse.json({ error: cronAuth.message }, { status: cronAuth.status });
    }

    const result = await runAutoUnassignInactiveConversationsJob();
    return NextResponse.json(result, {
      status: result.success ? 200 : 207,
    });
  } catch (error) {
    logger.error('Auto-unassign inactive conversations failed', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Auto-unassign inactive conversations failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export const POST = handleAutoUnassignInactiveConversations;
export const GET = handleAutoUnassignInactiveConversations;
export const PUT = () => NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
export const DELETE = () => NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
