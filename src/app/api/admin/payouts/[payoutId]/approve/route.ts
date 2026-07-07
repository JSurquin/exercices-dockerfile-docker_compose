import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { getRequestContext, getClientIP, logUnauthorizedAccess } from '@/lib/security/audit-helpers';
import { prisma } from '~/prisma/prisma';
import {
  createInstantWithdrawal,
  calculateWhitepayFees,
  convertWhitepayStatus,
  parseWhitepayNetworkFeeCents,
  type WhitepayInstantWithdrawalRequest,
  type WhitepayTravelRule,
  type WhitepayTransactionStatus,
} from '@/lib/whitepay';
import { createCardPayout, createSepaPayout, convertFlexifyStatus, isTransactionCompleted } from '@/lib/flexify';
import { decrypt } from '@/lib/encryption';
import crypto from 'crypto';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { PayoutLifecycle } from '@/lib/payout-lifecycle';

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
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
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

    const pmType = payout.paymentMethod.type;

    // ————— Flexify (carte ou SEPA) : exécuter le payout avec le payload stocké —————
    if (pmType === 'FLEXIFY_CARD' || pmType === 'SEPA') {
      const encrypted = payout.pendingFlexifyRequestEncrypted;
      if (!encrypted) {
        return NextResponse.json(
          { error: 'Données de payout Flexify manquantes (pendingFlexifyRequestEncrypted)' },
          { status: 400 }
        );
      }
      let payload: { method: 'card' | 'sepa'; reference: string; amountCents: number; customer: object; card?: object; sepa?: object; description?: string };
      try {
        payload = JSON.parse(decrypt(encrypted)) as typeof payload;
      } catch (e) {
        console.error('[admin/payouts/approve] Flexify payload decrypt failed', e);
        return NextResponse.json(
          { error: 'Impossible de décrypter les données du payout' },
          { status: 400 }
        );
      }
      try {
        if (payload.method === 'card' && payload.card && payload.customer) {
          const res = await createCardPayout({
            reference: payload.reference,
            amountCents: payload.amountCents,
            customer: payload.customer as { identifier: string; email: string; country: string; ip: string },
            card: payload.card as { number: string; holderName: string; expireMonth: string; expireYear: string; cvv: string },
          });
          if (res.code !== 0 || !res.transaction) {
            throw new Error(res.error_message || 'Échec Flexify carte');
          }
          const internalStatus = convertFlexifyStatus(res.transaction.status);
          await prisma.payout.update({
            where: { id: payoutId },
            data: {
              status: internalStatus as 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED',
              flexifyPayoutId: res.transaction.id,
              pendingFlexifyRequestEncrypted: null,
            },
          });
          if (isTransactionCompleted(res.transaction.status)) {
            const { debited } = await PayoutLifecycle.onCompleted(
              payout.userId, payoutId, payout.amountCents,
              { tradeId: payout.tradeId, reason: `Payout Flexify carte ${payoutId} complété (instant)`, finalStatus: internalStatus, paidAt: new Date() },
            );
            if (!debited) {
              return NextResponse.json({ error: 'Débit du solde échoué, payout non finalisé.' }, { status: 400 });
            }
          }
          await prisma.auditLog.create({
            data: {
              userId: session.user.id,
              action: 'ADMIN_PAYOUT_APPROVED',
              details: {
                payoutId,
                targetUserId: payout.userId,
                amountCents: payout.amountCents,
                flexifyTransactionId: res.transaction.id,
                method: 'FLEXIFY_CARD',
              },
              ipAddress: getClientIP(request),
            },
          });
          return NextResponse.json({
            success: true,
            payoutId,
            flexifyTransactionId: res.transaction.id,
            status: internalStatus,
          });
        }
        if (payload.method === 'sepa' && payload.sepa && payload.customer) {
          const res = await createSepaPayout({
            reference: payload.reference,
            amountCents: payload.amountCents,
            description: payload.description,
            customer: payload.customer as { identifier: string; email: string; phone: string; first_name: string; last_name: string; address: string; country: string; ip: string },
            sepa: payload.sepa as { iban: string; bic?: string; beneficiary_first_name: string; beneficiary_last_name: string; beneficiary_country: string; beneficiary_city: string; beneficiary_address: string; beneficiary_email: string },
          });
          if (res.code !== 0 || !res.transaction) {
            throw new Error(res.error_message || 'Échec Flexify SEPA');
          }
          const internalStatus = convertFlexifyStatus(res.transaction.status);
          await prisma.payout.update({
            where: { id: payoutId },
            data: {
              status: internalStatus as 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED',
              flexifyPayoutId: res.transaction.id,
              pendingFlexifyRequestEncrypted: null,
            },
          });
          if (isTransactionCompleted(res.transaction.status)) {
            const { debited } = await PayoutLifecycle.onCompleted(
              payout.userId, payoutId, payout.amountCents,
              { tradeId: payout.tradeId, reason: `Payout Flexify SEPA ${payoutId} complété (instant)`, finalStatus: internalStatus, paidAt: new Date() },
            );
            if (!debited) {
              return NextResponse.json({ error: 'Débit du solde échoué, payout non finalisé.' }, { status: 400 });
            }
          }
          await prisma.auditLog.create({
            data: {
              userId: session.user.id,
              action: 'ADMIN_PAYOUT_APPROVED',
              details: {
                payoutId,
                targetUserId: payout.userId,
                amountCents: payout.amountCents,
                flexifyTransactionId: res.transaction.id,
                method: 'SEPA',
              },
              ipAddress: getClientIP(request),
            },
          });
          return NextResponse.json({
            success: true,
            payoutId,
            flexifyTransactionId: res.transaction.id,
            status: internalStatus,
          });
        }
      } catch (err) {
        console.error('[admin/payouts/approve] Flexify error:', err);
        await PayoutLifecycle.onFailed(payout.userId, payoutId, payout.amountCents, {
          tradeId: payout.tradeId,
          finalStatus: 'FAILED',
        });
        await prisma.payout.update({
          where: { id: payoutId },
          data: { errorMessage: err instanceof Error ? err.message : 'Erreur Flexify' },
        });
        return NextResponse.json(
          { error: 'Échec de l\'appel Flexify. Payout marqué en échec.', details: err instanceof Error ? err.message : String(err) },
          { status: 502 }
        );
      }
    }

    // payout-request accepte WHITEPAY_CRYPTO et CRYPTO (legacy) — même flux Whitepay
    if (pmType !== 'WHITEPAY_CRYPTO' && pmType !== 'CRYPTO') {
      return NextResponse.json(
        { error: 'Type de payout non géré pour approbation' },
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

    const platformFees =
      payout.processingFeeCents ?? calculateWhitepayFees(payout.amountCents).processingFeeCents;
    const amountEur = (payout.amountCents - platformFees) / 100;
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
      await PayoutLifecycle.onFailed(payout.userId, payoutId, payout.amountCents, {
        tradeId: payout.tradeId,
        finalStatus: 'FAILED',
      });
      await prisma.payout.update({
        where: { id: payoutId },
        data: { errorMessage: err instanceof Error ? err.message : 'Erreur WhitePay' },
      });
      return NextResponse.json(
        { error: 'Échec de l\'appel WhitePay. Payout marqué en échec.', details: err instanceof Error ? err.message : String(err) },
        { status: 502 }
      );
    }

    const internalStatus = convertWhitepayStatus(tx.status as WhitepayTransactionStatus);

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
        processingFeeCents: platformFees,
        networkFeeCents: parseWhitepayNetworkFeeCents(tx.fee),
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
