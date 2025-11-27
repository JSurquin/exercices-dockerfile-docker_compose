import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import {
  initiateSepaPayout,
  validateSepaPayoutParams,
  type InitiateSepaPayoutParams,
} from '@/lib/gatefi-offramp';
import { canUserMakePayout, getOrCreateSumsubToken } from '@/lib/gatefi-kyc';

/**
 * POST /api/gatefi/offramp/sell
 * Initie un paiement SEPA
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
      cryptoAmount,
      crypto,
      region,
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

    // Obtenir le token Sumsub pour partager le KYC
    const sumsubToken = await getOrCreateSumsubToken(userId);

    // Préparer les paramètres
    const params: InitiateSepaPayoutParams = {
      amountCents: amountCents || payout.amountCents,
      cryptoAmount,
      crypto,
      region,
      orderCustomId: payoutId, // Utiliser le payoutId comme orderCustomId
      userEmail: payout.user.email,
      sumsubToken,
    };

    // Valider les paramètres
    const validation = validateSepaPayoutParams(params);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Initier le paiement SEPA
    const result = await initiateSepaPayout(params);

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

    return NextResponse.json({
      success: true,
      redirectUrl: result.redirectUrl,
      orderCustomId: result.orderCustomId,
      payoutId,
    });
  } catch (error) {
    console.error('[GateFi OffRamp Sell] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate SEPA payout',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

