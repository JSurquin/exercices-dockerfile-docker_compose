import { NextRequest, NextResponse } from 'next/server';
import { AuditLogger } from '@/lib/security';
import { logger } from '@/lib/logger';
import { requireCronSecret } from '@/lib/cron-auth';
import { runSecurityMaintenanceJob } from '@/lib/cron-jobs/security-maintenance';

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

async function handleSecurityMaintenance(req: NextRequest): Promise<NextResponse> {
  try {
    const cronAuth = isCronAuthorized(req);
    if (!cronAuth.ok) {
      logger.warn('Unauthorized cron access attempt', {
        ip: req.headers.get('x-forwarded-for') || 'Unknown',
        userAgent: req.headers.get('user-agent'),
      });
      return NextResponse.json({ error: cronAuth.message }, { status: cronAuth.status });
    }

    const result = await runSecurityMaintenanceJob();
    return NextResponse.json(result, {
      status: result.success ? 200 : 207,
    });
  } catch (error) {
    logger.error('Security maintenance failed', { error });

    try {
      await AuditLogger.log({
        action: 'system.maintenance_failed' as never,
        details: {
          type: 'security_maintenance',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        severity: 'high',
      });
    } catch (logError) {
      logger.error('Failed to log maintenance failure', { logError });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Security maintenance failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const POST = handleSecurityMaintenance;
export const GET = handleSecurityMaintenance;
export const PUT = () => NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
export const DELETE = () => NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
