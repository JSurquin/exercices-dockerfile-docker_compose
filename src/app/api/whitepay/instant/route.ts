import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import { PayoutLifecycle } from '@/lib/payout-lifecycle';
import {
  createInstantWithdrawal,
  parseWhitepayFeesFromResponse,
  getWhitepayLimits,
  centsToEur,
  validateWalletAddress,
  networkRequiresMemo,
  convertWhitepayStatus,
  WHITEPAY_SUPPORTED_CRYPTOS,
  type WhitepayInstantWithdrawalRequest,
  type WhitepayTravelRule,
} from '@/lib/whitepay';
import { canUserMakePayout } from '@/lib/kycaid';
import crypto from 'crypto';
import { safeParseJson } from '@/lib/validation/helpers';
import { whitepayPayoutRequestBodySchema } from '@/lib/validation/schemas/integrations';
import { assertTradeOwnership } from '@/lib/trade-ownership';
import { validateAmountCents } from '@/lib/amount-validation';
import { checkWithdrawalLimit } from '@/lib/balance-service';

const generateOrderId = () => `WPI-${crypto.randomUUID()}`;

// =============================================================================
// POST - Créer un retrait crypto instantané via Whitepay (Instant Flow)
// Combine création + taux + confirmation en un seul appel
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification
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

    // 2. Vérifier le KYC
    const kycCheck = await canUserMakePayout(userId);
    if (!kycCheck.allowed) {
      return NextResponse.json(
        { error: kycCheck.reason, code: 'KYC_REQUIRED' },
        { status: 403 }
      );
    }

    // 3. Parser le body
    const raw = await request.json();
    const parsed = safeParseJson(raw, whitepayPayoutRequestBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const body = parsed.data;
    const {
      amountCents: amountCentsRaw,
      tradeId,
      targetCurrency,
      network,
      walletAddress,
      memo,
      travelRule,
    } = body;
    const amountCents = validateAmountCents(amountCentsRaw);

    if (amountCents === null) {
      return NextResponse.json(
        { error: 'Montant invalide (doit être un entier positif en centimes)' },
        { status: 400 }
      );
    }

    if (tradeId) {
      const ownsTrade = await assertTradeOwnership(tradeId, userId);
      if (!ownsTrade) {
        return NextResponse.json(
          { error: 'Trade non trouvé ou accès non autorisé' },
          { status: 403 }
        );
      }
    }

    const limits = getWhitepayLimits();
    if (amountCents < limits.minCents) {
      return NextResponse.json(
        { error: `Montant minimum: ${centsToEur(limits.minCents)}€` },
        { status: 400 }
      );
    }
    if (amountCents > limits.maxCents) {
      return NextResponse.json(
        { error: `Montant maximum: ${centsToEur(limits.maxCents)}€` },
        { status: 400 }
      );
    }

    // 5. Validation de la crypto et du réseau
    if (!targetCurrency || !network) {
      return NextResponse.json(
        { error: 'Crypto et réseau requis' },
        { status: 400 }
      );
    }

    const supportedCrypto = WHITEPAY_SUPPORTED_CRYPTOS.find(
      (c) => c.ticker === targetCurrency.toUpperCase()
    );
    if (!supportedCrypto) {
      return NextResponse.json(
        { error: `Crypto non supportée: ${targetCurrency}` },
        { status: 400 }
      );
    }

    if (!supportedCrypto.networks.includes(network.toUpperCase() as never)) {
      return NextResponse.json(
        { error: `Réseau ${network} non supporté pour ${targetCurrency}` },
        { status: 400 }
      );
    }

    // 6. Validation de l'adresse wallet
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Adresse wallet requise' },
        { status: 400 }
      );
    }

    const addressValidation = validateWalletAddress(walletAddress, network);
    if (!addressValidation.isValid) {
      return NextResponse.json(
        { error: addressValidation.error },
        { status: 400 }
      );
    }

    // 7. Vérification du memo si nécessaire
    if (networkRequiresMemo(network) && !memo) {
      return NextResponse.json(
        { error: `Un memo/tag est requis pour le réseau ${network}` },
        { status: 400 }
      );
    }

    // 8. Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, balanceCents: true, frozenBalanceCents: true, accountFrozen: true },
    });

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Email utilisateur requis' },
        { status: 400 }
      );
    }

    if (user.accountFrozen) {
      return NextResponse.json({ error: 'Compte suspendu' }, { status: 403 });
    }

    const availableCents = Math.max(0, user.balanceCents - user.frozenBalanceCents);
    if (availableCents < amountCents) {
      return NextResponse.json(
        { error: `Solde insuffisant (disponible : ${centsToEur(availableCents)}€)` },
        { status: 400 }
      );
    }

    const withdrawalCheck = await checkWithdrawalLimit(userId, amountCents);
    if (!withdrawalCheck.allowed) {
      return NextResponse.json(
        { error: `Limite de retrait mensuelle dépassée (utilisé : ${(withdrawalCheck.usedCents / 100).toFixed(2)}€, limite : ${(withdrawalCheck.limitCents! / 100).toFixed(2)}€)` },
        { status: 400 }
      );
    }

    const orderId = generateOrderId();
    const amountEur = amountCents / 100;

    const travelRuleObj = travelRule as Record<string, unknown> | null | undefined;

    // Travel Rule obligatoire pour l'EEE (même logique que withdrawal standard)
    const travelRulePayload: WhitepayTravelRule | undefined = travelRuleObj && travelRuleObj.type && travelRuleObj.vasp && travelRuleObj.name && travelRuleObj.address
      ? {
          type: travelRuleObj.type === 'entity' ? 'entity' : 'individual',
          vasp: String(travelRuleObj.vasp),
          name: String(travelRuleObj.name),
          address: String(travelRuleObj.address),
        }
      : {
          type: 'individual' as const,
          vasp: 'Self-custody',
          name: (user.name || user.email || 'User').trim() || 'User',
          address: travelRuleObj?.address ? String(travelRuleObj.address) : 'N/A',
        };

    // Create payment method + payout in DB BEFORE calling WhitePay API
    let paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        userId,
        type: 'WHITEPAY_CRYPTO',
        details: { path: ['address'], equals: walletAddress },
      },
    });

    if (!paymentMethod) {
      paymentMethod = await prisma.paymentMethod.create({
        data: {
          userId,
          type: 'WHITEPAY_CRYPTO',
          details: { address: walletAddress, network, targetCurrency, memo: memo || null },
          isVerified: true,
        },
      });
    }

    const payout = await prisma.payout.create({
      data: {
        userId,
        tradeId: tradeId || null,
        status: 'PROCESSING',
        amountCents,
        paymentMethodId: paymentMethod.id,
        whitepayTargetCurrency: targetCurrency.toUpperCase(),
        whitepayNetwork: network.toUpperCase(),
        whitepayAddress: walletAddress,
        whitepayMemo: memo || null,
      },
    });
    try {
      await PayoutLifecycle.onCreated(userId, payout.id, amountCents);
    } catch (freezeErr) {
      await prisma.payout.update({ where: { id: payout.id }, data: { status: 'FAILED', errorMessage: 'freeze_failed' } });
      if (freezeErr instanceof Error && freezeErr.message === 'INSUFFICIENT_AVAILABLE_BALANCE') {
        return NextResponse.json({ error: 'Solde insuffisant' }, { status: 409 });
      }
      throw freezeErr;
    }

    const instantParams: WhitepayInstantWithdrawalRequest = {
      amount: amountEur,
      currency: 'EUR',
      target_currency: targetCurrency.toUpperCase(),
      network: network.toUpperCase(),
      address: walletAddress,
      memo: memo || undefined,
      travel_rule: travelRulePayload,
      order_id: orderId,
    };

    let tx;
    try {
      const whitepayResponse = await createInstantWithdrawal(instantParams);
      tx = whitepayResponse.transaction;
    } catch (apiErr) {
      await PayoutLifecycle.onFailed(userId, payout.id, amountCents, {
        tradeId: tradeId || null,
        finalStatus: 'FAILED',
      });
      await prisma.payout.update({
        where: { id: payout.id },
        data: { errorMessage: apiErr instanceof Error ? apiErr.message : 'Erreur WhitePay' },
      });
      throw apiErr;
    }

    const internalStatus = convertWhitepayStatus(tx.status);
    const realFees = parseWhitepayFeesFromResponse(tx.fee);

    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: internalStatus as 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'WHITEPAY_PENDING_WITHDRAWAL' | 'WHITEPAY_PROCESSING_WITHDRAWAL' | 'WHITEPAY_COMPLETE' | 'WHITEPAY_DECLINED',
        whitepayTransactionId: tx.id,
        whitepayStatus: tx.status,
        whitepayExchangeRate: tx.exchange_rate,
        whitepayTargetValue: tx.target_value,
        whitepayFee: tx.fee,
        whitepayEstimatedAt: new Date(tx.estimated_at),
        whitepayConfirmedAt: new Date(),
        processingFeeCents: realFees.processingFeeCents,
        networkFeeCents: realFees.networkFeeCents,
      },
    });

    // 14. Mettre à jour le trade si associé
    if (tradeId) {
      await prisma.trade.update({
        where: { id: tradeId },
        data: { status: 'PAYOUT_PENDING' },
      });
    }

    // 15. Logger l'événement
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'WHITEPAY_INSTANT_WITHDRAWAL_CREATED',
        details: {
          payoutId: payout.id,
          orderId,
          whitepayTransactionId: tx.id,
          amountCents,
          targetCurrency,
          network,
          exchangeRate: tx.exchange_rate,
          targetValue: tx.target_value,
          fee: tx.fee,
          status: tx.status,
        },
      },
    });

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        orderId,
        status: internalStatus,
        amountCents,
        fees: {
          processingCents: realFees.processingFeeCents,
          networkCents: realFees.networkFeeCents,
          totalCents: realFees.totalFeeCents,
        },
        netCents: amountCents - realFees.totalFeeCents,
      },
      whitepay: {
        transactionId: tx.id,
        status: tx.status,
        exchangeRate: tx.exchange_rate,
        targetValue: tx.target_value,
        targetCurrency: tx.target_currency?.ticker || targetCurrency,
        fee: tx.fee,
        txHash: tx.tx_hash,
      },
    });
  } catch (error) {
    console.error('[Whitepay Instant] Error:', error);
    if (error instanceof Error && error.message === 'INSUFFICIENT_AVAILABLE_BALANCE') {
      return NextResponse.json({ error: 'Solde insuffisant' }, { status: 409 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors du retrait crypto instantané' },
      { status: 500 }
    );
  }
}
