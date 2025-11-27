import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import {
  initiateCryptoPayout,
  validateCryptoPayoutParams,
  type InitiateCryptoPayoutParams,
} from '@/lib/gatefi-onramp';
import { canUserMakePayout, getOrCreateSumsubToken } from '@/lib/gatefi-kyc';

/**
 * POST /api/gatefi/onramp/buy
 * Initie un paiement crypto
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const {
      payoutId,
      amountCents,
      crypto,
      region,
      walletAddress,
      successUrl,
      cancelUrl,
      declineUrl,
    } = body;

    // Vérifier le KYC
    const kycCheck = await canUserMakePayout(userId);
    if (!kycCheck.allowed) {
      return NextResponse.json(
        { error: kycCheck.reason || 'KYC verification required' },
        { status: 403 }
      );
    }

    // Vérifier que le payout existe et appartient à l'utilisateur
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        user: true,
        paymentMethod: true,
      },
    });

    if (!payout || payout.userId !== userId) {
      return NextResponse.json(
        { error: 'Payout not found or unauthorized' },
        { status: 404 }
      );
    }

    // Vérifier que le payout n'est pas déjà traité
    if (payout.status !== 'PENDING' && payout.status !== 'VERIFICATION_REQUIRED') {
      return NextResponse.json(
        { error: 'Payout already processed or in progress' },
        { status: 400 }
      );
    }

    // Vérifier que le paymentMethod est de type CRYPTO
    if (payout.paymentMethod.type !== 'CRYPTO') {
      return NextResponse.json(
        { error: 'Payment method must be CRYPTO for this endpoint' },
        { status: 400 }
      );
    }

    // Obtenir le token Sumsub pour partager le KYC
    const sumsubToken = await getOrCreateSumsubToken(userId);

    // Préparer les paramètres
    const params: InitiateCryptoPayoutParams = {
      amountCents: amountCents || payout.amountCents,
      crypto,
      region,
      walletAddress,
      orderCustomId: payoutId, // Utiliser le payoutId comme orderCustomId
      userEmail: payout.user.email,
      sumsubToken,
      successUrl,
      cancelUrl,
      declineUrl,
    };

    // Valider les paramètres
    const validation = validateCryptoPayoutParams(params);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Initier le paiement crypto
    const result = await initiateCryptoPayout(params);

    // Mettre à jour le payout dans la base de données
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'PROCESSING',
        gateFiOrderId: result.orderCustomId,
        gateFiWidgetUrl: result.redirectUrl,
        updatedAt: new Date(),
      },
    });

    // Mettre à jour les détails du paymentMethod avec l'adresse wallet
    await prisma.paymentMethod.update({
      where: { id: payout.paymentMethodId },
      data: {
        details: {
          ...(payout.paymentMethod.details as any),
          walletAddress,
          crypto,
        },
      },
    });

    return NextResponse.json({
      success: true,
      redirectUrl: result.redirectUrl,
      orderCustomId: result.orderCustomId,
      payoutId,
    });
  } catch (error) {
    console.error('[GateFi OnRamp Buy] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate crypto payout',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

