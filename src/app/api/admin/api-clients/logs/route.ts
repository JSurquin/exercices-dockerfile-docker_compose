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
  const rawLimit = searchParams.get('limit');
  const parsedLimit = rawLimit && /^\d+$/.test(rawLimit) ? parseInt(rawLimit, 10) : 50;
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 50;

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
