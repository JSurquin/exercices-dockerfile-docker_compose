import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import { getVerification, updateUserKycStatus, isUserKycVerified } from '@/lib/kycaid';

/**
 * Route de polling pour vérifier l'état d'une vérification KYC en mode développement
 * 
 * En production, les webhooks sont utilisés.
 * En développement, comme localhost n'est pas accessible depuis internet,
 * on doit poller cette route pour vérifier l'état.
 * 
 * GET /api/kycaid/poll/[verificationId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { verificationId: string } }
) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { verificationId } = params;

    console.log(`[KYCAID Poll] Polling verification ${verificationId} for user ${userId}`);

    // Vérifier que la vérification appartient bien à l'utilisateur
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

    console.log(`[KYCAID Poll] Current DB status:`, {
      status: kycVerification.status,
      verified: kycVerification.verified,
    });

    // Appeler l'API KYCAID pour obtenir le statut actuel
    let verificationData;
    try {
      verificationData = await getVerification(verificationId);
    } catch (error) {
      console.error(`[KYCAID Poll] Error fetching verification:`, error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du statut KYC' },
        { status: 500 }
      );
    }

    console.log(`[KYCAID Poll] Status from API:`, {
      status: verificationData.status,
      verified: verificationData.verified,
    });

    // Mettre à jour la BDD avec le statut actuel
    await prisma.kycVerification.update({
      where: { id: kycVerification.id },
      data: {
        status: verificationData.status.toUpperCase() as any,
        verified: verificationData.verified,
        documentStatus: verificationData.verifications?.document?.status,
        documentVerified: verificationData.verifications?.document?.verified,
        facialStatus: verificationData.verifications?.facial?.status,
        facialVerified: verificationData.verifications?.facial?.verified,
        addressStatus: verificationData.verifications?.address?.status,
        addressVerified: verificationData.verifications?.address?.verified,
        amlStatus: verificationData.verifications?.aml?.status,
        amlVerified: verificationData.verifications?.aml?.verified,
        metadata: verificationData as any,
        ...(verificationData.status === 'completed' && { completedAt: new Date() }),
      },
    });

    // Si la vérification est complétée, mettre à jour le statut utilisateur (sauf si déjà à jour)
    if (verificationData.status === 'completed') {
      const hasStatusChanged =
        kycVerification.verified !== verificationData.verified ||
        kycVerification.status !== verificationData.status.toUpperCase();

      if (verificationData.verified === true) {
        // Ne pas rappeler updateUserKycStatus si l'utilisateur est déjà vérifié (évite emails en double)
        const alreadyVerified = await isUserKycVerified(userId);
        if (!alreadyVerified) {
          await updateUserKycStatus(userId, 'VERIFIED', verificationId);
        }
        console.log(`[KYCAID Poll] ✅ KYC VERIFIED for user ${userId}`);
        return NextResponse.json({
          status: 'completed',
          verified: true,
          message: 'KYC vérifié avec succès !',
          statusChanged: hasStatusChanged,
        });
      } else {
        // KYC refusé ou révoqué : mettre à jour seulement si pas déjà rejeté
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { kycStatus: true },
        });
        if (user?.kycStatus !== 'REJECTED') {
          const declineReasons = collectDeclineReasons(verificationData);
          const reasonText = declineReasons.join(', ') || 'Aucune raison spécifiée';
          await updateUserKycStatus(userId, 'REJECTED', verificationId, reasonText);
        }
        const declineReasons = collectDeclineReasons(verificationData);
        console.log(`[KYCAID Poll] ❌ KYC REJECTED for user ${userId}`);
        return NextResponse.json({
          status: 'completed',
          verified: false,
          message: 'KYC refusé ou révoqué',
          declineReasons,
          statusChanged: hasStatusChanged,
        });
      }
    }

    // Vérification encore en cours
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

/**
 * Collecte les raisons de refus
 */
function collectDeclineReasons(verification: any): string[] {
  const reasons: string[] = [];

  if (verification.verifications?.document?.decline_reasons) {
    reasons.push(...verification.verifications.document.decline_reasons);
  }
  if (verification.verifications?.facial?.decline_reasons) {
    reasons.push(...verification.verifications.facial.decline_reasons);
  }
  if (verification.verifications?.address?.decline_reasons) {
    reasons.push(...verification.verifications.address.decline_reasons);
  }
  if (verification.verifications?.aml?.decline_reasons) {
    reasons.push(...verification.verifications.aml.decline_reasons);
  }

  return [...new Set(reasons)]; // Dédupliquer
}

/**
 * Message utilisateur selon le statut
 */
function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    unused: 'En attente de soumission du formulaire',
    pending: 'Vérification en cours...',
    completed: 'Vérification terminée',
  };
  
  return messages[status] || 'Statut inconnu';
}
