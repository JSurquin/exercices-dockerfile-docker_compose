import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { getOnRampOrderStatus } from '@/lib/gatefi-onramp';

/**
 * GET /api/gatefi/onramp/orders/[orderId]
 * Récupère le statut d'un ordre OnRamp
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
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
    const { orderId } = params;

    // Vérifier que le payout appartient à l'utilisateur
    const payout = await prisma.payout.findFirst({
      where: {
        gateFiOrderId: orderId,
        userId,
      },
      include: {
        paymentMethod: true,
      },
    });

    if (!payout) {
      return NextResponse.json(
        { error: 'Order not found or unauthorized' },
        { status: 404 }
      );
    }

    // Récupérer l'adresse wallet depuis les détails du payment method
    const walletAddress = (payout.paymentMethod.details as any)?.walletAddress;
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address not found in payment method' },
        { status: 400 }
      );
    }

    // Récupérer le statut depuis GateFi
    const orderStatus = await getOnRampOrderStatus({
      orderId,
      walletAddress,
    });

    // Mettre à jour le statut dans la base de données si nécessaire
    if (orderStatus.status === 'COMPLETED' && payout.status !== 'PAID') {
      await prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          txId: orderStatus.txHash,
          paymentReference: orderStatus.txHash,
        },
      });
    } else if (
      (orderStatus.status === 'FAILED' || orderStatus.status === 'EXPIRED') &&
      payout.status !== 'FAILED'
    ) {
      await prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: 'FAILED',
        },
      });
    }

    return NextResponse.json({
      success: true,
      order: orderStatus,
      payoutId: payout.id,
    });
  } catch (error) {
    console.error('[GateFi OnRamp Order Status] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get order status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

