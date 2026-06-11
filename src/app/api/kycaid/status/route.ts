import { NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import {
  checkKycStatus,
  resolveDeclineReasonsFromDb,
  resolveAllDeclineReasons,
} from '@/lib/kycaid';
import { prisma } from '~/prisma/prisma';

// =============================================================================
// GET - Obtenir le statut KYC détaillé
// =============================================================================

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        kycStatus: true,
        email: true,
        name: true,
        kycDocuments: {
          orderBy: { uploadedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            type: true,
            status: true,
            kycaidDocumentId: true,
            uploadedAt: true,
            reviewedAt: true,
            rejectionReason: true,
          },
        },
        kycVerifications: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            kycaidVerificationId: true,
            status: true,
            verified: true,
            declineReasons: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const currentStatus = await checkKycStatus(userId);
    const dbReasons = await resolveDeclineReasonsFromDb(userId);

    const latestVerification = user.kycVerifications?.[0];
    const storedDeclineReasons = Array.isArray(latestVerification?.declineReasons)
      ? (latestVerification.declineReasons as string[]).filter((r) => typeof r === 'string')
      : [];

    const declineReasons = resolveAllDeclineReasons(
      null,
      null,
      currentStatus.declineReasons?.length
        ? currentStatus.declineReasons
        : storedDeclineReasons.length
          ? storedDeclineReasons
          : dbReasons
    );

    let message = '';
    let canRetry = false;

    switch (currentStatus.status) {
      case 'VERIFIED':
        message = 'Votre identité a été vérifiée avec succès.';
        break;
      case 'REJECTED':
        if (declineReasons.length > 0) {
          message = `Votre vérification a été rejetée pour la raison suivante : ${declineReasons.join(', ')}`;
        } else {
          message =
            'Votre vérification a été rejetée. Veuillez soumettre de nouveaux documents valides ou contacter le support.';
        }
        canRetry = true;
        break;
      case 'PENDING':
        if (user.kycDocuments.length > 0) {
          message = 'Votre vérification est en cours de traitement.';
        } else {
          message = 'Veuillez compléter la vérification de votre identité.';
          canRetry = true;
        }
        break;
    }

    const verificationId = latestVerification?.kycaidVerificationId;

    return NextResponse.json({
      status: currentStatus.status,
      message,
      canRetry,
      verificationUrl: currentStatus.verificationUrl,
      verificationId,
      declineReasons,
      documents: user.kycDocuments,
      user: {
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('[KYCAID Status] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du statut KYC' },
      { status: 500 }
    );
  }
}
