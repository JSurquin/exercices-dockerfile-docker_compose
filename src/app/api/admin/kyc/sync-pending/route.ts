import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { syncUserKycFromKycaid } from '@/lib/kycaid';
import { getRequestContext, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

/**
 * POST /api/admin/kyc/sync-pending
 *
 * Parcourt tous les utilisateurs avec kycStatus PENDING ou IN_PROGRESS,
 * interroge KYCAID pour leur statut réel et met à jour la base.
 * Utile quand le webhook n'a pas été reçu (callback URL absente, secret incorrect, etc.)
 *
 * Le sync unitaire (bouton par user) via force-verify fonctionne pour tous les statuts,
 * y compris REJECTED et VERIFIED.
 */
export async function POST(request: NextRequest) {
  const context = getRequestContext(request);
  const session = await requireAdminSessionWithDbCheck(request);
  if (!session) {
    await logUnauthorizedAccess(context, '/api/admin/kyc/sync-pending', 'Admin required');
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const results: {
    userId: string;
    oldStatus: string;
    newStatus: string | null;
    error?: string;
  }[] = [];

  const users = await prisma.user.findMany({
    where: {
      kycaidApplicantId: { not: null },
      kycStatus: { in: ['PENDING', 'IN_PROGRESS', 'KYCAID_PENDING'] },
    },
    select: {
      id: true,
      kycStatus: true,
    },
  });

  console.log(`[Admin KYC Sync] Syncing ${users.length} pending users...`);

  for (const user of users) {
    try {
      const result = await syncUserKycFromKycaid(user.id);

      if (result.kycaidApiError && !result.success) {
        results.push({
          userId: user.id,
          oldStatus: user.kycStatus,
          newStatus: null,
          error: result.kycaidApiError,
        });
        continue;
      }

      results.push({
        userId: user.id,
        oldStatus: user.kycStatus,
        newStatus: result.newStatus ?? null,
        ...(result.message && !result.success ? { error: result.message } : {}),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error(`[Admin KYC Sync] Error for user ${user.id}:`, message);
      results.push({ userId: user.id, oldStatus: user.kycStatus, newStatus: null, error: message });
    }
  }

  const verified = results.filter((r) => r.newStatus === 'VERIFIED').length;
  const rejected = results.filter((r) => r.newStatus === 'REJECTED').length;
  const unchanged = results.filter((r) => r.newStatus === null && !r.error).length;
  const errors = results.filter((r) => r.error).length;

  console.log(`[Admin KYC Sync] Done: ${verified} verified, ${rejected} rejected, ${unchanged} unchanged, ${errors} errors`);

  return NextResponse.json({
    success: true,
    total: users.length,
    verified,
    rejected,
    unchanged,
    errors,
    details: results,
  });
}
