import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function GET(request: NextRequest) {
  const session = await requireAdminSessionWithDbCheck(request);
  if (!session) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const apiClientId = searchParams.get('api_client_id');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

  const logs = await prisma.partnerApiLog.findMany({
    where: apiClientId ? { apiClientId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      apiClient: { select: { name: true, keyPrefix: true } },
    },
  });

  return NextResponse.json({
    logs: logs.map((log) => ({
      id: log.id,
      api_client_id: log.apiClientId,
      partner_name: log.apiClient.name,
      key_prefix: log.apiClient.keyPrefix,
      endpoint: log.endpoint,
      method: log.method,
      status_code: log.statusCode,
      ip_address: log.ipAddress,
      duration_ms: log.durationMs,
      created_at: log.createdAt.toISOString(),
    })),
  });
}
