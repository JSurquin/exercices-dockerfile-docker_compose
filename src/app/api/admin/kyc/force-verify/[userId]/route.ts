import { NextRequest, NextResponse } from 'next/server';
import { syncUserKycFromKycaid } from '@/lib/kycaid';
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

  try {
    const result = await syncUserKycFromKycaid(userId, {
      force,
      adminId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    });

    if (result.kycaidApiError && !result.success) {
      return NextResponse.json(
        { error: result.kycaidApiError, message: result.message },
        { status: 502 }
      );
    }

    if (!result.success && result.message === 'Aucun applicant KYCAID lié à cet utilisateur') {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: result.success,
      newStatus: result.newStatus,
      source: result.source,
      kycaidStatus: result.kycaidStatus,
      verified: result.verified,
      message: result.message,
      declineReasons: result.declineReasons,
    });
  } catch (err) {
    console.error(`[Admin KYC Force Verify] Error for user ${userId}:`, err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
