import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import {
  listApplicantVerifications,
  updateUserKycStatus,
} from '@/lib/kycaid';
import { getRequestContext, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

/**
 * POST /api/admin/kyc/force-verify/[userId]
 *
 * Interroge KYCAID pour l'utilisateur et met à jour son statut en base.
 * Si KYCAID le retourne comme vérifié → VERIFIED.
 * Si décliné → REJECTED.
 * Sinon → renvoie le statut KYCAID brut sans modifier la base.
 *
 * Query param ?force=true : force le statut VERIFIED même si KYCAID ne le confirme pas encore
 * (à utiliser uniquement en cas de certitude manuelle).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const context = getRequestContext(request);
  const session = await requireAdminSessionWithDbCheck(request);
  if (!session) {
    await logUnauthorizedAccess(context, '/api/admin/kyc/force-verify/[userId]', 'Admin required');
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const { userId } = await params;
  const force = new URL(request.url).searchParams.get('force') === 'true';

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      kycStatus: true,
      kycaidApplicantId: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
  }

  if (!user.kycaidApplicantId) {
    if (force) {
      // Aucun applicant KYCAID — forcer manuellement (override admin)
      await updateUserKycStatus(userId, 'VERIFIED');
      return NextResponse.json({ success: true, newStatus: 'VERIFIED', source: 'manual_admin_override' });
    }
    return NextResponse.json({ error: 'Aucun applicant KYCAID lié à cet utilisateur' }, { status: 400 });
  }

  try {
    const verifications = await listApplicantVerifications(user.kycaidApplicantId);
    const latest = verifications.items?.[0];

    if (!latest) {
      if (force) {
        await updateUserKycStatus(userId, 'VERIFIED');
        return NextResponse.json({ success: true, newStatus: 'VERIFIED', source: 'manual_admin_override' });
      }
      return NextResponse.json({
        success: false,
        message: 'Aucune vérification trouvée sur KYCAID',
        kycaidStatus: null,
      });
    }

    if (latest.verified === true) {
      await updateUserKycStatus(userId, 'VERIFIED', latest.verification_id);
      return NextResponse.json({ success: true, newStatus: 'VERIFIED', source: 'kycaid', kycaidStatus: latest.status });
    }

    if (latest.status === 'declined') {
      await updateUserKycStatus(userId, 'REJECTED', latest.verification_id);
      return NextResponse.json({ success: true, newStatus: 'REJECTED', source: 'kycaid', kycaidStatus: latest.status });
    }

    if (force) {
      // Admin force malgré le statut KYCAID non résolu
      await updateUserKycStatus(userId, 'VERIFIED');
      return NextResponse.json({ success: true, newStatus: 'VERIFIED', source: 'manual_admin_override', kycaidStatus: latest.status });
    }

    return NextResponse.json({
      success: false,
      message: 'KYCAID ne confirme pas encore la vérification',
      kycaidStatus: latest.status,
      verified: latest.verified,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error(`[Admin KYC Force Verify] Error for user ${userId}:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
