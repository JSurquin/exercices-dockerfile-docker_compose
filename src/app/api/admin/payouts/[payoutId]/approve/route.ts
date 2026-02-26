import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getRequestContext, getClientIP, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { prisma } from '~/prisma/prisma';
import {
  createInstantWithdrawal,
  convertWhitepayStatus,
  type WhitepayInstantWithdrawalRequest,
  type WhitepayTravelRule,
} from '@/lib/whitepay';
import crypto from 'crypto';

const generateOrderId = () => `WPA-${crypto.randomUUID()}`;

/**
 * POST - Approuver un payout en attente (PENDING_APPROVAL) et déclencher le retrait WhitePay instant.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  const context = getRequestContext(request);
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || session.user.role !== 'ADMIN') {
      await logUnauthorizedAccess(context, '/api/admin/payouts/[payoutId]/approve', 'Admin required');
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { payoutId } = await params;
    if (!payoutId) {
      return NextResponse.json({ error: 'payoutId requis' }, { status: 400 });
    }

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        paymentMethod: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });

    if (!payout) {
      return NextResponse.json({ error: 'Payout non trouvé' }, { status: 404 });
    }

    if (payout.status !== 'PENDING_APPROVAL') {
      return NextResponse.json(
        { error: `Ce payout ne peut pas être approuvé (statut: ${payout.status})` },
        { status: 400 }
      );
    }

    if (payout.paymentMethod.type !== 'WHITEPAY_CRYPTO') {
      return NextResponse.json(
        { error: 'Seuls les payouts crypto (Whitepay) peuvent être approuvés ici' },
        { status: 400 }
      );
    }

    const address = payout.whitepayAddress ?? (payout.paymentMethod.details as { address?: string })?.address;
    const network = payout.whitepayNetwork ?? (payout.paymentMethod.details as { network?: string })?.network;
    const targetCurrency = payout.whitepayTargetCurrency ?? (payout.paymentMethod.details as { targetCurrency?: string })?.targetCurrency;
    const memo = payout.whitepayMemo ?? (payout.paymentMethod.details as { memo?: string })?.memo ?? undefined;

    if (!address || !network || !targetCurrency) {
      return NextResponse.json(
        { error: 'Données de paiement incomplètes (adresse, réseau ou devise manquants)' },
        { status: 400 }
      );
    }

    const amountEur = payout.amountCents / 100;
    const orderId = generateOrderId();
    const user = payout.user;
    const travelRulePayload: WhitepayTravelRule = {
      type: 'individual',
      vasp: 'Self-custody',
      name: (user.name || user.email || 'User').trim() || 'User',
      address: 'N/A',
    };

    const instantParams: WhitepayInstantWithdrawalRequest = {
      amount: amountEur,
      currency: 'EUR',
      target_currency: targetCurrency,
      network,
      address,
      memo: memo || undefined,
      travel_rule: travelRulePayload,
      order_id: orderId,
    };

    let tx: { id: string; status: string; exchange_rate: string; target_value: string; fee: string | null; estimated_at: string };
    try {
      const whitepayResponse = await createInstantWithdrawal(instantParams);
      tx = whitepayResponse.transaction;
    } catch (err) {
      console.error('[admin/payouts/approve] WhitePay error:', err);
      await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: 'FAILED',
          errorMessage: err instanceof Error ? err.message : 'Erreur WhitePay',
        },
      });
      return NextResponse.json(
        { error: 'Échec de l\'appel WhitePay. Payout marqué en échec.', details: err instanceof Error ? err.message : String(err) },
        { status: 502 }
      );
    }

    const internalStatus = convertWhitepayStatus(tx.status);

    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: internalStatus as 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'WHITEPAY_PENDING_WITHDRAWAL' | 'WHITEPAY_PROCESSING_WITHDRAWAL' | 'WHITEPAY_COMPLETE' | 'WHITEPAY_DECLINED',
        whitepayTransactionId: tx.id,
        whitepayStatus: tx.status,
        whitepayExchangeRate: tx.exchange_rate,
        whitepayTargetValue: tx.target_value,
        whitepayFee: tx.fee,
        whitepayEstimatedAt: new Date(tx.estimated_at),
        whitepayConfirmedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_PAYOUT_APPROVED',
        details: {
          payoutId,
          targetUserId: payout.userId,
          amountCents: payout.amountCents,
          whitepayTransactionId: tx.id,
          orderId,
        },
        ipAddress: getClientIP(request),
      },
    });

    return NextResponse.json({
      success: true,
      payoutId,
      whitepayTransactionId: tx.id,
      status: internalStatus,
    });
  } catch (err) {
    console.error('[admin/payouts/approve]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
