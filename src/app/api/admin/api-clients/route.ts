import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { createApiClient, revokeApiClient, sanitizeApiClient } from '@/lib/partner-api/key-service';
import { partnerCreateApiClientSchema } from '@/lib/partner-api/schemas';
import { safeParseJson } from '@/lib/validation/helpers';

export async function GET(request: NextRequest) {
  const session = await requireAdminSessionWithDbCheck(request);
  if (!session) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const clients = await prisma.apiClient.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { steamUsername: true, steamId: true, email: true } },
      _count: { select: { apiLogs: true, webhookDeliveries: true } },
    },
  });

  return NextResponse.json({
    clients: clients.map((c) => ({
      ...sanitizeApiClient(c),
      user: {
        steam_username: c.user.steamUsername,
        steam_id: c.user.steamId,
        email: c.user.email,
      },
      stats: {
        api_calls: c._count.apiLogs,
        webhook_deliveries: c._count.webhookDeliveries,
      },
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSessionWithDbCheck(request);
  if (!session) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const raw = await request.json();
  const parsed = safeParseJson(raw, partnerCreateApiClientSchema);
  if (!parsed.ok) return parsed.response;

  const user = await prisma.user.findUnique({ where: { id: parsed.data.user_id } });
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
  }

  const { client, rawKey } = await createApiClient({
    name: parsed.data.name,
    userId: parsed.data.user_id,
    createdBy: session.user.id,
    rateLimitPerMin: parsed.data.rate_limit_per_min,
    scopes: parsed.data.scopes,
    expiresAt: parsed.data.expires_at ? new Date(parsed.data.expires_at) : null,
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'ADMIN_ACTION',
      details: {
        type: 'api_client_created',
        apiClientId: client.id,
        targetUserId: parsed.data.user_id,
      },
    },
  });

  return NextResponse.json({
    client: sanitizeApiClient(client),
    api_key: rawKey,
    webhook_secret: client.webhookSecret,
    warning: 'Conservez la clé API et le secret webhook — ils ne seront plus affichés.',
  });
}
