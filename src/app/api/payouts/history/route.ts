import { NextRequest, NextResponse } from "next/server";
import { prisma } from "~/prisma/prisma";
import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/payouts/history
 * Récupère l'historique des payouts de l'utilisateur connecté
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Récupérer les payouts de l'utilisateur
    const payouts = await prisma.payout.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limiter à 50 derniers payouts
      select: {
        id: true,
        amountCents: true,
        processingFeeCents: true,
        networkFeeCents: true,
        status: true,
        paidAt: true,
        balanceDebitedAt: true,
        createdAt: true,
        updatedAt: true,
        paymentReference: true,
        flexifyPayoutId: true,
        paymentMethod: {
          select: {
            type: true,
          },
        },
      },
    });

    // Formater la réponse
    const formattedPayouts = payouts.map((payout) => {
      const fees = (payout.processingFeeCents || 0) + (payout.networkFeeCents || 0);
      const netAmount = payout.amountCents - fees;
      
      return {
        id: payout.id,
        amount: payout.amountCents,
        fees: fees,
        netAmount: netAmount,
        status: payout.status,
        paidAt: payout.paidAt?.toISOString() ?? null,
        balanceDebitedAt: payout.balanceDebitedAt?.toISOString() ?? null,
        method: payout.paymentMethod?.type || 'UNKNOWN',
        createdAt: payout.createdAt.toISOString(),
        updatedAt: payout.updatedAt.toISOString(),
        reference: payout.paymentReference,
        flexifyPayoutId: payout.flexifyPayoutId,
      };
    });

    return NextResponse.json({
      payouts: formattedPayouts,
      total: payouts.length,
    });
  } catch (error) {
    logger.error("Error fetching payout history", { error });
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique" },
      { status: 500 }
    );
  }
}

