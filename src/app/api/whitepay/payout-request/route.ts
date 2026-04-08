import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import {
  createInstantWithdrawal,
  calculateWhitepayFees,
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
import { getPayoutAutoApproveSettings } from '@/lib/payout-settings';
import crypto from 'crypto';

const generateOrderId = () => `WPR-${crypto.randomUUID()}`;

// =============================================================================
// POST - Demande de retrait crypto (unifiée : auto-instant si sous seuil, sinon PENDING_APPROVAL)
// =============================================================================

export async function POST(request: NextRequest) {
  try {
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

    const kycCheck = await canUserMakePayout(userId);
    if (!kycCheck.allowed) {
      return NextResponse.json(
        { error: kycCheck.reason, code: 'KYC_REQUIRED' },
        { status: 403 }
      );
    }

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

    if (networkRequiresMemo(network) && !memo) {
      return NextResponse.json(
        { error: `Un memo/tag est requis pour le réseau ${network}` },
        { status: 400 }
      );
    }

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

    const fees = calculateWhitepayFees(amountCents);
    const amountEur = amountCents / 100;

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

    // Créer ou récupérer la méthode de paiement (commun aux deux branches)
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

    const autoSettings = await getPayoutAutoApproveSettings();
    const shouldAutoApprove = autoSettings.enabled && amountCents <= autoSettings.thresholdCents;

    if (shouldAutoApprove) {
      // Appel WhitePay instant et création du payout avec statut WhitePay
      const orderId = generateOrderId();
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
      const internalStatus = convertWhitepayStatus(tx.status);

      // Utiliser les frais réels retournés par Whitepay (tx.fee = total EUR)
      const realFees = parseWhitepayFeesFromResponse(tx.fee);

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
        },
      });

      if (tradeId) {
        await prisma.trade.update({
          where: { id: tradeId },
          data: { status: 'PAYOUT_PENDING' },
        });
      }

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
            autoApproved: true,
          },
        },
      });

      return NextResponse.json({
        success: true,
        autoApproved: true,
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
    }

    // Sinon : créer le payout en PENDING_APPROVAL (sans appeler WhitePay)
    const payout = await prisma.payout.create({
      data: {
        userId,
        tradeId: tradeId || null,
        status: 'PENDING_APPROVAL',
        amountCents,
        paymentMethodId: paymentMethod.id,
        whitepayAddress: walletAddress,
        whitepayNetwork: network.toUpperCase(),
        whitepayMemo: memo || null,
        whitepayTargetCurrency: targetCurrency.toUpperCase(),
        processingFeeCents: fees.processingFeeCents,
        networkFeeCents: fees.networkFeeCents,
      },
    });

    if (tradeId) {
      await prisma.trade.update({
        where: { id: tradeId },
        data: { status: 'PAYOUT_PENDING' },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PAYOUT_REQUEST_PENDING_APPROVAL',
        details: {
          payoutId: payout.id,
          amountCents,
          targetCurrency,
          network,
          reason: 'above_threshold',
        },
      },
    });

    return NextResponse.json({
      success: true,
      autoApproved: false,
      pendingApproval: true,
      payout: {
        id: payout.id,
        status: 'PENDING_APPROVAL',
        amountCents,
        fees: {
          processingCents: fees.processingFeeCents,
          networkCents: fees.networkFeeCents,
          totalCents: fees.totalFeeCents,
        },
        netCents: amountCents - fees.totalFeeCents,
      },
      message: 'Demande enregistrée. Elle sera traitée sous 24 h.',
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'WhitepayApiError') {
      const wpError = error as Error & { statusCode?: number; responseData?: unknown };
      const responseDataStr = wpError.responseData
        ? JSON.stringify(wpError.responseData, null, 2)
        : 'no response data';
      console.error('[Whitepay PayoutRequest] WhitepayApiError:', {
        message: wpError.message,
        statusCode: wpError.statusCode,
        responseData: wpError.responseData,
      });
      return NextResponse.json(
        {
          error: 'Erreur API Whitepay',
          details: wpError.message,
          statusCode: wpError.statusCode,
          whitepayResponse: wpError.responseData ?? null,
          whitepayResponseRaw: responseDataStr,
        },
        { status: wpError.statusCode && wpError.statusCode >= 400 && wpError.statusCode < 500 ? 400 : 502 }
      );
    }
    console.error('[Whitepay PayoutRequest] Error:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors de la demande de retrait',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
