import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { initiateKyc, checkKycStatus } from '@/lib/kycaid';
import { prisma } from '~/prisma/prisma';

// =============================================================================
// POST - Initier le processus KYC
// =============================================================================

export async function POST(request: NextRequest) {
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

    // Vérifier si l'utilisateur est déjà vérifié
    const currentStatus = await checkKycStatus(userId);
    
    if (currentStatus.status === 'VERIFIED') {
      return NextResponse.json({
        success: true,
        status: 'VERIFIED',
        message: 'Votre identité est déjà vérifiée',
      });
    }

    // Si rejeté, on peut relancer le processus
    if (currentStatus.status === 'REJECTED') {
      console.log('[KYCAID] Re-initiating KYC for rejected user:', userId);
    }

    // Initier le KYC
    const kycResult = await initiateKyc(userId);

    // Logger l'événement
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'KYC_INITIATED',
        details: {
          verificationId: kycResult.verificationId,
          applicantId: kycResult.applicantId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      verificationUrl: kycResult.verificationUrl,
      verificationId: kycResult.verificationId,
      applicantId: kycResult.applicantId,
    });
  } catch (error) {
    console.error('[KYCAID] Error initiating KYC:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'initialisation du KYC' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Vérifier le statut KYC actuel
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
    const status = await checkKycStatus(userId);

    return NextResponse.json({
      ...status,
      userId,
    });
  } catch (error) {
    console.error('[KYCAID] Error checking status:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut KYC' },
      { status: 500 }
    );
  }
}

