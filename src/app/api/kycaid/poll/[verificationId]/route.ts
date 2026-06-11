import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import {
  getVerification,
  getApplicant,
  updateUserKycStatus,
  isUserKycVerified,
  isKycaidVerified,
  isKycaidTerminalRejected,
  isKycaidTerminal,
  resolveAllDeclineReasons,
} from '@/lib/kycaid';

/**
 * Route de polling pour vérifier l'état d'une vérification KYC en mode développement
 *
 * GET /api/kycaid/poll/[verificationId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ verificationId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = session.user.id;
    const { verificationId } = await params;

    const kycVerification = await prisma.kycVerification.findFirst({
      where: {
        kycaidVerificationId: verificationId,
        userId,
      },
    });

    if (!kycVerification) {
      return NextResponse.json(
        { error: 'Vérification non trouvée ou non autorisée' },
        { status: 404 }
      );
    }

    let verificationData;
    try {
      verificationData = await getVerification(verificationId);
    } catch (error) {
      console.error('[KYCAID Poll] Error fetching verification:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du statut KYC' },
        { status: 500 }
      );
    }

    let applicant = null;
    try {
      applicant = await getApplicant(kycVerification.kycaidApplicantId);
    } catch (error) {
      console.warn('[KYCAID Poll] Could not fetch applicant for decline reasons:', error);
    }

    const declineReasons = resolveAllDeclineReasons(verificationData, applicant);
    const isTerminal = isKycaidTerminal(verificationData);

    await prisma.kycVerification.update({
      where: { id: kycVerification.id },
      data: {
        status: verificationData.status.toUpperCase() as any,
        verified: verificationData.verified === true,
        documentStatus: verificationData.verifications?.document?.status,
        documentVerified: verificationData.verifications?.document?.verified,
        facialStatus: verificationData.verifications?.facial?.status,
        facialVerified: verificationData.verifications?.facial?.verified,
        addressStatus: verificationData.verifications?.address?.status,
        addressVerified: verificationData.verifications?.address?.verified,
        amlStatus: verificationData.verifications?.aml?.status,
        amlVerified: verificationData.verifications?.aml?.verified,
        declineReasons: declineReasons as any,
        metadata: verificationData as any,
        ...(isTerminal && { completedAt: new Date() }),
      },
    });

    if (isKycaidVerified(verificationData)) {
      const hasStatusChanged =
        kycVerification.verified !== true ||
        kycVerification.status !== verificationData.status.toUpperCase();

      const alreadyVerified = await isUserKycVerified(userId);
      if (!alreadyVerified) {
        await updateUserKycStatus(userId, 'VERIFIED', verificationId);
      }

      return NextResponse.json({
        status: verificationData.status,
        verified: true,
        message: 'KYC vérifié avec succès !',
        statusChanged: hasStatusChanged,
      });
    }

    if (isKycaidTerminalRejected(verificationData)) {
      const hasStatusChanged =
        kycVerification.verified !== false ||
        kycVerification.status !== verificationData.status.toUpperCase();

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { kycStatus: true },
      });

      if (user?.kycStatus !== 'REJECTED' && user?.kycStatus !== 'KYCAID_REJECTED') {
        const reasonText = declineReasons.join(', ') || 'Aucune raison spécifiée';
        await updateUserKycStatus(userId, 'REJECTED', verificationId, reasonText);
      }

      return NextResponse.json({
        status: verificationData.status,
        verified: false,
        message: 'KYC refusé ou révoqué',
        declineReasons,
        statusChanged: hasStatusChanged,
      });
    }

    return NextResponse.json({
      status: verificationData.status,
      verified: verificationData.verified,
      message: getStatusMessage(verificationData.status),
      verifications: {
        document: {
          status: verificationData.verifications?.document?.status,
          verified: verificationData.verifications?.document?.verified,
        },
        facial: {
          status: verificationData.verifications?.facial?.status,
          verified: verificationData.verifications?.facial?.verified,
        },
        address: {
          status: verificationData.verifications?.address?.status,
          verified: verificationData.verifications?.address?.verified,
        },
        aml: {
          status: verificationData.verifications?.aml?.status,
          verified: verificationData.verifications?.aml?.verified,
        },
      },
    });
  } catch (error) {
    console.error('[KYCAID Poll] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut KYC' },
      { status: 500 }
    );
  }
}

function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    unused: 'En attente de soumission du formulaire',
    pending: 'Vérification en cours...',
    completed: 'Vérification terminée',
    declined: 'Vérification refusée',
    verified: 'Vérification approuvée',
  };

  return messages[status] || 'Statut inconnu';
}
