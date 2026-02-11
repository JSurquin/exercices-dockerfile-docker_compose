import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import {
  createWithdrawal,
  calculateWhitepayFees,
  getWhitepayLimits,
  centsToEur,
  validateWalletAddress,
  networkRequiresMemo,
  WHITEPAY_SUPPORTED_CRYPTOS,
  type WhitepayWithdrawalRequest,
} from '@/lib/whitepay';
import { canUserMakePayout } from '@/lib/kycaid';
import crypto from 'crypto';

const generateOrderId = () => `WP-${crypto.randomUUID()}`;

// =============================================================================
// POST - Créer un retrait crypto via Whitepay (Standard Flow)
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
    const body = await request.json();
    const {
      amountCents,
      tradeId,
      targetCurrency,
      network,
      walletAddress,
      memo,
      travelRule,
    } = body;

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
      select: { email: true, name: true },
    });

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Email utilisateur requis' },
        { status: 400 }
      );
    }

    // 9. Calculer les frais
    const fees = calculateWhitepayFees(amountCents);
    const orderId = generateOrderId();
    const amountEur = amountCents / 100;

    // 10. Appeler Whitepay API - Standard Flow
    const withdrawalParams: WhitepayWithdrawalRequest = {
      amount: amountEur,
      currency: 'EUR',
      target_currency: targetCurrency.toUpperCase(),
      network: network.toUpperCase(),
      address: walletAddress,
      memo: memo || undefined,
      travel_rule: travelRule || undefined,
      order_id: orderId,
    };

    const whitepayResponse = await createWithdrawal(withdrawalParams);
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

    // 12. Créer le payout en base
    const payout = await prisma.payout.create({
      data: {
        userId,
        tradeId: tradeId || null,
        status: 'WHITEPAY_WAITING_CONFIRMATION',
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
        processingFeeCents: fees.processingFeeCents,
        networkFeeCents: fees.networkFeeCents,
      },
    });

    // 13. Logger l'événement
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'WHITEPAY_WITHDRAWAL_CREATED',
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
        },
      },
    });

    // 14. Retourner la réponse avec les infos nécessaires pour confirmation
    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        orderId,
        status: payout.status,
        amountCents,
        fees: {
          processingCents: fees.processingFeeCents,
          networkCents: fees.networkFeeCents,
          totalCents: fees.totalFeeCents,
        },
        netCents: amountCents - fees.totalFeeCents,
      },
      whitepay: {
        transactionId: tx.id,
        exchangeRate: tx.exchange_rate,
        targetValue: tx.target_value,
        targetCurrency: tx.target_currency?.ticker || targetCurrency,
        fee: tx.fee,
        estimatedAt: tx.estimated_at,
        /** Le client a 30 secondes pour confirmer */
        expiresAt: new Date(new Date(tx.estimated_at).getTime() + 30_000).toISOString(),
        status: tx.status,
      },
    });
  } catch (error) {
    console.error('[Whitepay Withdrawal] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du retrait crypto' },
      { status: 500 }
    );
  }
}
