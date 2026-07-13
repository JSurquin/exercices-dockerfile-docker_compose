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

  const deliveries = await prisma.partnerWebhookDelivery.findMany({
    where: apiClientId ? { apiClientId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      apiClient: { select: { name: true, keyPrefix: true } },
    },
  });

  return NextResponse.json({
    deliveries: deliveries.map((d) => ({
      id: d.id,
      api_client_id: d.apiClientId,
      partner_name: d.apiClient.name,
      key_prefix: d.apiClient.keyPrefix,
      event_type: d.eventType,
      resource_id: d.resourceId,
      event_id: d.eventId,
      status: d.status,
      http_status: d.httpStatus,
      attempts: d.attempts,
      error_message: d.errorMessage,
      duration_ms: d.durationMs,
      created_at: d.createdAt.toISOString(),
      last_attempt_at: d.lastAttemptAt?.toISOString() ?? null,
    })),
  });
}
