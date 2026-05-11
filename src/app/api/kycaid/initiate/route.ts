import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { initiateKyc, checkKycStatus } from '@/lib/kycaid';
import { prisma } from '~/prisma/prisma';
import { safeParseJson } from '@/lib/validation/helpers';
import { kycaidInitiateBodySchema } from '@/lib/validation/schemas/integrations';
import { logger } from '@/lib/logger';

// =============================================================================
// POST - Initier le processus KYC
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    logger.info('[KYCAID Initiate] POST request received');
    
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      logger.info('[KYCAID Initiate] No user session');
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Récupérer l'adresse du body (optionnel)
    const raw = await request.json().catch(() => ({}));
    const parsed = safeParseJson(raw, kycaidInitiateBodySchema);
    const body = parsed.ok ? parsed.data : {};
    const { address } = body;
    logger.debug('[KYCAID Initiate] Address provided:', !!address);

    // Vérifier si l'utilisateur est déjà vérifié
    const currentStatus = await checkKycStatus(userId);
    logger.debug('[KYCAID Initiate] Current status:', currentStatus.status);
    
    if (currentStatus.status === 'VERIFIED') {
      logger.info('[KYCAID Initiate] User already verified, skipping');
      return NextResponse.json({
        success: true,
        status: 'VERIFIED',
        message: 'Votre identité est déjà vérifiée',
      });
    }

    // Anti-spam : bloquer si une vérification PENDING existe et a été créée il y a moins de 5 min
    const recentPendingVerification = await prisma.kycVerification.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'UNUSED'] },
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentPendingVerification) {
      logger.info('[KYCAID Initiate] Blocked: recent pending verification exists');
      return NextResponse.json({
        success: false,
        status: 'PENDING',
        message: 'Une vérification est déjà en cours. Veuillez patienter avant de réessayer.',
        verificationId: recentPendingVerification.kycaidVerificationId,
      }, { status: 429 });
    }

    // Si rejeté, on peut relancer le processus
    if (currentStatus.status === 'REJECTED') {
      logger.info('[KYCAID Initiate] Re-initiating KYC for rejected user');
    }

    // Initier le KYC avec l'adresse si fournie
    logger.debug('[KYCAID Initiate] Calling initiateKyc()...');
    const kycResult = await initiateKyc(userId, address);
    logger.info('[KYCAID Initiate] KYC initiated successfully');

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
    logger.error('[KYCAID Initiate] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'initialisation du KYC',
        details: errorMessage,
      },
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
    logger.error('[KYCAID] Error checking status:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut KYC' },
      { status: 500 }
    );
  }
}

