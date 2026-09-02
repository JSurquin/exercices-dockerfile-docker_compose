import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { revokeApiClient, sanitizeApiClient, updateApiClient } from '@/lib/partner-api/key-service';
import { partnerUpdateApiClientSchema } from '@/lib/partner-api/schemas';
import { safeParseJson } from '@/lib/validation/helpers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSessionWithDbCheck(request);
  if (!session) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.apiClient.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Clé non trouvée' }, { status: 404 });
  }
  if (existing.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Clé révoquée ou expirée' }, { status: 400 });
  }

  const raw = await request.json();
  const parsed = safeParseJson(raw, partnerUpdateApiClientSchema);
  if (!parsed.ok) return parsed.response;

  if (parsed.data.rate_limit_per_min === undefined && parsed.data.scopes === undefined) {
    return NextResponse.json({ error: 'Aucune modification fournie' }, { status: 400 });
  }

  const client = await updateApiClient(id, {
    rateLimitPerMin: parsed.data.rate_limit_per_min,
    scopes: parsed.data.scopes,
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'ADMIN_ACTION',
      details: {
        type: 'api_client_updated',
        apiClientId: id,
        changes: parsed.data,
      },
    },
  });

  return NextResponse.json({ success: true, client: sanitizeApiClient(client) });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSessionWithDbCheck(request);
  if (!session) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.apiClient.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Clé non trouvée' }, { status: 404 });
  }

  await revokeApiClient(id);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'ADMIN_ACTION',
      details: { type: 'api_client_revoked', apiClientId: id, partnerName: existing.name },
    },
  });

  return NextResponse.json({ success: true });
}
