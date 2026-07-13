import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { revokeApiClient, sanitizeApiClient } from '@/lib/partner-api/key-service';

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
      details: { type: 'api_client_revoked', apiClientId: id },
    },
  });

  return NextResponse.json({ success: true, client: sanitizeApiClient({ ...existing, status: 'REVOKED' }) });
}
