import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import {
  listApplicantVerifications,
  updateUserKycStatus,
} from '@/lib/kycaid';
import { getRequestContext, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

/**
 * POST /api/admin/kyc/sync-pending
 *
 * Parcourt tous les utilisateurs avec kycStatus PENDING ou IN_PROGRESS,
 * interroge KYCAID pour leur statut réel et met à jour la base.
 * Utile quand le webhook n'a pas été reçu (callback URL absente, secret incorrect, etc.)
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

  // Récupérer tous les users avec applicant KYCAID et statut non résolu
  const users = await prisma.user.findMany({
    where: {
      kycaidApplicantId: { not: null },
      kycStatus: { in: ['PENDING', 'IN_PROGRESS', 'KYCAID_PENDING'] },
    },
    select: {
      id: true,
      kycStatus: true,
      kycaidApplicantId: true,
    },
  });

  console.log(`[Admin KYC Sync] Syncing ${users.length} pending users...`);

  for (const user of users) {
    try {
      const verifications = await listApplicantVerifications(user.kycaidApplicantId!);
      const latest = verifications.items?.[0];

      if (!latest) {
        results.push({ userId: user.id, oldStatus: user.kycStatus, newStatus: null, error: 'No verification found on KYCAID' });
        continue;
      }

      if (latest.verified === true) {
        await updateUserKycStatus(user.id, 'VERIFIED', latest.verification_id);
        results.push({ userId: user.id, oldStatus: user.kycStatus, newStatus: 'VERIFIED' });
      } else if (latest.status === 'declined') {
        await updateUserKycStatus(user.id, 'REJECTED', latest.verification_id);
        results.push({ userId: user.id, oldStatus: user.kycStatus, newStatus: 'REJECTED' });
      } else {
        // Encore en cours côté KYCAID — mettre à jour le statut kycVerification en base
        await prisma.kycVerification.upsert({
          where: { kycaidVerificationId: latest.verification_id },
          update: { status: latest.status.toUpperCase() as any, verified: false },
          create: {
            userId: user.id,
            kycaidVerificationId: latest.verification_id,
            kycaidApplicantId: user.kycaidApplicantId!,
            status: latest.status.toUpperCase() as any,
            verified: false,
          },
        });
        results.push({ userId: user.id, oldStatus: user.kycStatus, newStatus: null });
      }
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
