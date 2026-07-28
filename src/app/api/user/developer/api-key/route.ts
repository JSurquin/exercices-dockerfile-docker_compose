import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { requireUserSession } from '@/lib/require-session-user';
import { canUserManageApiKeys } from '@/lib/partner-api/developer-access';
import {
  createApiClient,
  getActiveApiClientForUser,
  regenerateApiClientCredentials,
  sanitizeApiClient,
} from '@/lib/partner-api/key-service';

export async function GET(request: NextRequest) {
  const session = await requireUserSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const eligible = await canUserManageApiKeys(session.user.id);
  if (!eligible) {
    return NextResponse.json({ eligible: false, client: null });
  }

  const client = await getActiveApiClientForUser(session.user.id);
  return NextResponse.json({
    eligible: true,
    client: client ? sanitizeApiClient(client) : null,
  });
}

export async function POST(request: NextRequest) {
  const session = await requireUserSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const eligible = await canUserManageApiKeys(session.user.id);
  if (!eligible) {
    return NextResponse.json(
      { error: 'Accès réservé aux membres du programme développeur' },
      { status: 403 }
    );
  }

  const existing = await getActiveApiClientForUser(session.user.id);

  if (existing) {
    const { client, rawKey } = await regenerateApiClientCredentials(existing.id);

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_ACTION',
        details: {
          type: 'api_client_regenerated',
          apiClientId: client.id,
          selfService: true,
        },
      },
    });

    return NextResponse.json({
      client: sanitizeApiClient(client),
      api_key: rawKey,
      webhook_secret: client.webhookSecret,
      regenerated: true,
      warning:
        'Conservez la clé API et le secret webhook — ils ne seront plus affichés. L’ancienne clé est immédiatement invalidée.',
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { steamUsername: true, name: true },
  });

  const displayName = user?.steamUsername ?? user?.name ?? 'Partenaire';
  const { client, rawKey } = await createApiClient({
    name: `${displayName} API`,
    userId: session.user.id,
    createdBy: session.user.id,
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'USER_ACTION',
      details: {
        type: 'api_client_created',
        apiClientId: client.id,
        selfService: true,
      },
    },
  });

  return NextResponse.json({
    client: sanitizeApiClient(client),
    api_key: rawKey,
    webhook_secret: client.webhookSecret,
    regenerated: false,
    warning: 'Conservez la clé API et le secret webhook — ils ne seront plus affichés.',
  });
}
