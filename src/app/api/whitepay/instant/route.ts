import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import { freezeBalance } from '@/lib/balance-service';
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
    const amountCents = Number(amountCentsRaw);

    // 4. Validation du montant
    if (!amountCents || amountCents <= 0) {
      return NextResponse.json(
        { error: 'Montant invalide' },
        { status: 400 }
      );
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

    // 10. Appeler Whitepay API - Instant Flow
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

    const whitepayResponse = await createInstantWithdrawal(instantParams);
    const tx = whitepayResponse.transaction;

    // 11. Créer ou récupérer la méthode de paiement
    let paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        userId,
        type: 'WHITEPAY_CRYPTO',
        details: {
          path: ['address'],
          equals: walletAddress,
        },
      },
    });

    if (!paymentMethod) {
      paymentMethod = await prisma.paymentMethod.create({
        data: {
          userId,
          type: 'WHITEPAY_CRYPTO',
          details: {
            address: walletAddress,
            network,
            targetCurrency,
            memo: memo || null,
          },
          isVerified: true,
        },
      });
    }

    // 12. Convertir le statut Whitepay
    const internalStatus = convertWhitepayStatus(tx.status);

    // Utiliser les frais réels retournés par Whitepay (tx.fee = total EUR)
    const realFees = parseWhitepayFeesFromResponse(tx.fee);

    // 13. Créer le payout en base + geler la balance
    const payout = await prisma.payout.create({
      data: {
        userId,
        tradeId: tradeId || null,
        status: internalStatus as 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'WHITEPAY_PENDING_WITHDRAWAL' | 'WHITEPAY_PROCESSING_WITHDRAWAL' | 'WHITEPAY_COMPLETE' | 'WHITEPAY_DECLINED',
        amountCents,
        paymentMethodId: paymentMethod.id,
        whitepayTransactionId: tx.id,
        whitepayStatus: tx.status,
        whitepayExchangeRate: tx.exchange_rate,
        whitepayTargetValue: tx.target_value,
        whitepayTargetCurrency: targetCurrency.toUpperCase(),
        whitepayNetwork: network.toUpperCase(),
        whitepayAddress: walletAddress,
        whitepayMemo: memo || null,
        whitepayFee: tx.fee,
        whitepayEstimatedAt: new Date(tx.estimated_at),
        whitepayConfirmedAt: new Date(),
        processingFeeCents: realFees.processingFeeCents,
        networkFeeCents: realFees.networkFeeCents,
        balanceFrozenAt: new Date(),
      },
    });
    await freezeBalance(userId, amountCents);

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
    return NextResponse.json(
      { error: 'Erreur lors du retrait crypto instantané' },
      { status: 500 }
    );
  }
}
