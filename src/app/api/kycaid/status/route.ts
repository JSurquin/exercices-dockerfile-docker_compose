import { NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { checkKycStatus } from '@/lib/kycaid';
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
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Récupérer l'utilisateur avec son statut KYC
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
            providerId: true,
            uploadedAt: true,
            reviewedAt: true,
            rejectionReason: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier le statut actuel
    const currentStatus = await checkKycStatus(userId);

    // Déterminer le message à afficher
    let message = '';
    let canRetry = false;

    switch (currentStatus.status) {
      case 'VERIFIED':
        message = 'Votre identité a été vérifiée avec succès.';
        break;
      case 'REJECTED':
        message = 'Votre vérification a été refusée.';
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

    return NextResponse.json({
      status: currentStatus.status,
      message,
      canRetry,
      verificationUrl: currentStatus.verificationUrl,
      declineReasons: currentStatus.declineReasons,
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

