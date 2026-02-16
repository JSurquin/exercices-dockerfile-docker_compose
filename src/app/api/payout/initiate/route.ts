import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { canUserMakePayout } from '@/lib/gatefi-kyc';
import { checkWithdrawalLimit } from '@/lib/balance-service';

/**
 * POST /api/payout/initiate
 * Prépare un payout pour un trade disponible
 * L'utilisateur peut ensuite choisir SEPA ou Crypto
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
    const { tradeId } = body;

    if (!tradeId) {
      return NextResponse.json(
        { error: 'tradeId is required' },
        { status: 400 }
      );
    }

    // Vérifier que le trade appartient à l'utilisateur
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: {
        user: true,
        items: true,
      },
    });

    if (!trade || trade.userId !== userId) {
      return NextResponse.json(
        { error: 'Trade not found or unauthorized' },
        { status: 404 }
      );
    }

    // Vérifier que le trade est disponible pour payout
    if (trade.status !== 'AVAILABLE' && trade.status !== 'PAYOUT_PENDING') {
      return NextResponse.json(
        {
          error: 'Trade is not ready for payout',
          currentStatus: trade.status,
        },
        { status: 400 }
      );
    }

    // Vérifier le KYC
    const kycCheck = await canUserMakePayout(userId);
    if (!kycCheck.allowed) {
      return NextResponse.json(
        {
          error: kycCheck.reason || 'KYC verification required',
          requiresKyc: true,
        },
        { status: 403 }
      );
    }

    // Vérifier que le compte n'est pas gelé
    if (trade.user.accountFrozen) {
      return NextResponse.json(
        { error: 'Account frozen', accountFrozen: true },
        { status: 403 }
      );
    }

    // Vérifier le plafond mensuel de retrait
    const limitCheck = await checkWithdrawalLimit(userId, trade.netCents);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.reason || 'Monthly withdrawal limit exceeded', limitExceeded: true },
        { status: 403 }
      );
    }

    // Récupérer ou créer le payout
    let payout = await prisma.payout.findFirst({
      where: {
        tradeId,
        userId,
      },
      include: {
        paymentMethod: true,
      },
    });

    if (!payout) {
      // Créer une méthode de paiement par défaut si nécessaire
      let paymentMethod = await prisma.paymentMethod.findFirst({
        where: {
          userId,
          isDefault: true,
        },
      });

      if (!paymentMethod) {
        paymentMethod = await prisma.paymentMethod.create({
          data: {
            userId,
            type: 'SEPA', // Par défaut
            details: {},
            isDefault: true,
            isVerified: false,
          },
        });
      }

      // Créer le payout
      payout = await prisma.payout.create({
        data: {
          userId,
          tradeId,
          amountCents: trade.netCents,
          paymentMethodId: paymentMethod.id,
          status: 'PENDING',
        },
        include: {
          paymentMethod: true,
        },
      });

      // Mettre à jour le trade
      await prisma.trade.update({
        where: { id: tradeId },
        data: { status: 'PAYOUT_PENDING' },
      });
    }

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        amountCents: payout.amountCents,
        status: payout.status,
        paymentMethod: {
          id: payout.paymentMethod.id,
          type: payout.paymentMethod.type,
          isVerified: payout.paymentMethod.isVerified,
        },
      },
      trade: {
        id: trade.id,
        grossCents: trade.grossCents,
        cashoutFees: trade.cashoutFees,
        networkFees: trade.networkFees,
        netCents: trade.netCents,
        availableAt: trade.availableAt,
      },
      canProceed: true,
    });
  } catch (error) {
    console.error('[Payout Initiate] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate payout',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

