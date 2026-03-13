import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import {
  createWithdrawal,
  parseWhitepayFeesFromResponse,
  getWhitepayLimits,
  centsToEur,
  validateWalletAddress,
  networkRequiresMemo,
  WHITEPAY_SUPPORTED_CRYPTOS,
  WhitepayApiError,
  type WhitepayWithdrawalRequest,
  type WhitepayTravelRule,
} from '@/lib/whitepay';
import { canUserMakePayout } from '@/lib/kycaid';
import crypto from 'crypto';

const generateOrderId = () => `WP-${crypto.randomUUID()}`;

const LOG = (msg: string, data?: object) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[PAYOUT WHITEPAY CRYPTO] ${msg}`, data ?? '');
  }
};

// =============================================================================
// POST - Créer un retrait crypto via Whitepay (Standard Flow)
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    LOG('→ Début requête');
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      LOG('✗ Non authentifié');
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    LOG('✓ Session OK', { userId });

    const kycCheck = await canUserMakePayout(userId);
    if (!kycCheck.allowed) {
      LOG('✗ KYC non validé', { reason: kycCheck.reason });
      return NextResponse.json(
        { error: kycCheck.reason, code: 'KYC_REQUIRED' },
        { status: 403 }
      );
    }
    LOG('✓ KYC OK');

    const body = await request.json();
    LOG('Body reçu', { keys: Object.keys(body) });
    const {
      amountCents,
      tradeId,
      targetCurrency,
      network,
      walletAddress,
      memo,
      travelRule,
    } = body;

    if (!amountCents || amountCents <= 0) {
      LOG('✗ Montant invalide', { amountCents });
      return NextResponse.json(
        { error: 'Montant invalide' },
        { status: 400 }
      );
    }

    const limits = getWhitepayLimits();
    if (amountCents < limits.minCents) {
      LOG('✗ Montant trop bas', { amountCents, min: limits.minCents });
      return NextResponse.json(
        { error: `Montant minimum: ${centsToEur(limits.minCents)}€` },
        { status: 400 }
      );
    }
    if (amountCents > limits.maxCents) {
      LOG('✗ Montant trop élevé', { amountCents, max: limits.maxCents });
      return NextResponse.json(
        { error: `Montant maximum: ${centsToEur(limits.maxCents)}€` },
        { status: 400 }
      );
    }
    LOG('✓ Montant OK', { amountCents });

    if (!targetCurrency || !network) {
      LOG('✗ Crypto ou réseau manquant', { targetCurrency, network });
      return NextResponse.json(
        { error: 'Crypto et réseau requis' },
        { status: 400 }
      );
    }

    const supportedCrypto = WHITEPAY_SUPPORTED_CRYPTOS.find(
      (c) => c.ticker === targetCurrency.toUpperCase()
    );
    if (!supportedCrypto) {
      LOG('✗ Crypto non supportée', { targetCurrency });
      return NextResponse.json(
        { error: `Crypto non supportée: ${targetCurrency}` },
        { status: 400 }
      );
    }

    if (!supportedCrypto.networks.includes(network.toUpperCase() as never)) {
      LOG('✗ Réseau non supporté', { network, targetCurrency });
      return NextResponse.json(
        { error: `Réseau ${network} non supporté pour ${targetCurrency}` },
        { status: 400 }
      );
    }
    LOG('✓ Crypto et réseau OK', { targetCurrency, network });

    if (!walletAddress) {
      LOG('✗ Adresse wallet manquante');
      return NextResponse.json(
        { error: 'Adresse wallet requise' },
        { status: 400 }
      );
    }

    const addressValidation = validateWalletAddress(walletAddress, network);
    if (!addressValidation.isValid) {
      LOG('✗ Adresse wallet invalide', { error: addressValidation.error });
      return NextResponse.json(
        { error: addressValidation.error },
        { status: 400 }
      );
    }
    LOG('✓ Adresse wallet validée');

    if (networkRequiresMemo(network) && !memo) {
      LOG('✗ Memo requis pour ce réseau', { network });
      return NextResponse.json(
        { error: `Un memo/tag est requis pour le réseau ${network}` },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user?.email) {
      LOG('✗ Email utilisateur manquant');
      return NextResponse.json(
        { error: 'Email utilisateur requis' },
        { status: 400 }
      );
    }
    LOG('✓ User trouvé', { email: user.email });

    const orderId = generateOrderId();
    const amountEur = amountCents / 100;

    // Travel Rule obligatoire pour l'EEE : fourni par le client ou construit depuis l'utilisateur
    const travelRulePayload: WhitepayTravelRule | undefined = travelRule && typeof travelRule === 'object' && travelRule.type && travelRule.vasp && travelRule.name && travelRule.address
      ? {
          type: travelRule.type === 'entity' ? 'entity' : 'individual',
          vasp: String(travelRule.vasp),
          name: String(travelRule.name),
          address: String(travelRule.address),
        }
      : {
          type: 'individual' as const,
          vasp: 'Self-custody',
          name: (user.name || user.email || 'User').trim() || 'User',
          address: (typeof travelRule === 'object' && travelRule?.address) ? String(travelRule.address) : 'N/A',
        };

    const withdrawalParams: WhitepayWithdrawalRequest = {
      amount: amountEur,
      currency: 'EUR',
      target_currency: targetCurrency.toUpperCase(),
      network: network.toUpperCase(),
      address: walletAddress,
      memo: memo || undefined,
      travel_rule: travelRulePayload,
      order_id: orderId,
    };

    LOG('→ Appel Whitepay createWithdrawal', { orderId, amountEur, targetCurrency: withdrawalParams.target_currency, network: withdrawalParams.network });
    const whitepayResponse = await createWithdrawal(withdrawalParams);
    const tx = whitepayResponse.transaction;
    LOG('✓ Whitepay OK', { transactionId: tx?.id, status: tx?.status });

    // Utiliser les frais réels retournés par Whitepay (tx.fee = total EUR)
    const realFees = parseWhitepayFeesFromResponse(tx.fee);

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
        processingFeeCents: realFees.processingFeeCents,
        networkFeeCents: realFees.networkFeeCents,
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

    LOG('✓ Payout créé en BDD', { payoutId: payout.id });
    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        orderId,
        status: payout.status,
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
    const message = error instanceof Error ? error.message : 'Erreur lors de la création du retrait crypto';
    console.error('[PAYOUT WHITEPAY CRYPTO] Erreur', error);
    if (error instanceof WhitepayApiError && error.responseData) {
      console.error('[PAYOUT WHITEPAY CRYPTO] Détail API (ex. 422)', error.responseData);
    }
    // Renvoyer le détail 422 au client pour diagnostic (quels champs invalides)
    const status = error instanceof WhitepayApiError ? error.statusCode : 500;
    const body: { error: string; whitepayErrors?: unknown } = { error: message };
    if (error instanceof WhitepayApiError && error.responseData && typeof error.responseData === 'object') {
      const data = error.responseData as Record<string, unknown>;
      if (data.errors !== undefined) body.whitepayErrors = data.errors;
      else body.whitepayErrors = data;
    }
    return NextResponse.json(body, { status });
  }
}
