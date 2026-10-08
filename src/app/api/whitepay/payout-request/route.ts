import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import { PayoutLifecycle } from '@/lib/payout-lifecycle';
import { notifyAdminsPayoutPendingApproval } from '@/lib/admin-notification-hooks';
import {
  createInstantWithdrawal,
  calculateWhitepayFees,
  estimateNetworkFeeCents,
  parseWhitepayFeesFromResponse,
  calculateWhitepayNetCents,
  parseWhitepayNetworkFeeCents,
  getWhitepayLimits,
  centsToEur,
  validateWalletAddress,
  networkRequiresMemo,
  convertWhitepayStatus,
  isWhitepayCryptoNetworkSupported,
  getWhitepayCryptoByTicker,
  isUserPayoutTickerAllowed,
  formatWhitepayApiErrorMessage,
  WhitepayApiError,
  type WhitepayInstantWithdrawalRequest,
  type WhitepayTravelRule,
} from '@/lib/whitepay';
import { canUserMakePayout } from '@/lib/kycaid';
import { getPayoutAutoApproveSettings } from '@/lib/payout-settings';
import { assertTradeOwnership } from '@/lib/trade-ownership';
import { checkWithdrawalLimit } from '@/lib/balance-service';
import { validateAmountCents } from '@/lib/amount-validation';
import crypto from 'crypto';
import { safeParseJson } from '@/lib/validation/helpers';
import { whitepayPayoutRequestBodySchema } from '@/lib/validation/schemas/integrations';
import { RateLimiter, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';
import { jsonWithAskReview } from '@/lib/review-prompt';

const payoutRateLimiter = new RateLimiter('PAYOUT_WHITEPAY', RATE_LIMIT_CONFIGS.PAYOUT_REQUEST);

const generateOrderId = () => `WPR-${crypto.randomUUID()}`;

function toWhitepayTravelRule(
  travelRuleIn: unknown,
  user: { name: string | null; email: string }
): WhitepayTravelRule {
  if (
    travelRuleIn &&
    typeof travelRuleIn === 'object' &&
    'type' in travelRuleIn &&
    'vasp' in travelRuleIn &&
    'name' in travelRuleIn &&
    'address' in travelRuleIn
  ) {
    const tr = travelRuleIn as Record<string, unknown>;
    if (tr.vasp != null && tr.name != null && tr.address != null) {
      return {
        type: tr.type === 'entity' ? 'entity' : 'individual',
        vasp: String(tr.vasp),
        name: String(tr.name),
        address: String(tr.address),
      };
    }
  }
  return {
    type: 'individual',
    vasp: 'Self-custody',
    name: (user.name || user.email || 'User').trim() || 'User',
    address:
      travelRuleIn && typeof travelRuleIn === 'object' && 'address' in travelRuleIn
        ? String((travelRuleIn as Record<string, unknown>).address)
        : 'N/A',
  };
}

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

    const rateCheck = await payoutRateLimiter.checkLimit(request, userId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Trop de requêtes. Réessayez plus tard.' },
        { status: 429 }
      );
    }

    const kycCheck = await canUserMakePayout(userId);
    if (!kycCheck.allowed) {
      return NextResponse.json(
        { error: kycCheck.reason, code: 'KYC_REQUIRED' },
        { status: 403 }
      );
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, whitepayPayoutRequestBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const body = parsed.data;
    
    // Validation stricte du montant (entier positif uniquement)
    const rawAmount = body.amountCents ?? body.amount;
    const amountCents = validateAmountCents(rawAmount);
    
    if (amountCents === null) {
      return NextResponse.json(
        { error: 'Montant invalide (doit être un entier positif en centimes)' },
        { status: 400 }
      );
    }

    const tradeId = typeof body.tradeId === 'string' ? body.tradeId : undefined;
    
    // SÉCURITÉ: Vérifier que le trade appartient bien à l'utilisateur
    if (tradeId) {
      const ownsTrade = await assertTradeOwnership(tradeId, userId);
      if (!ownsTrade) {
        return NextResponse.json(
          { error: 'Trade non trouvé ou accès non autorisé' },
          { status: 403 }
        );
      }
    }
    const travelRuleRaw: unknown = body.travelRule;
    let targetCurrency: string | undefined =
      typeof body.targetCurrency === 'string' ? body.targetCurrency : undefined;
    let network: string | undefined = typeof body.network === 'string' ? body.network : undefined;
    let walletAddress: string | undefined =
      typeof body.walletAddress === 'string' ? body.walletAddress : undefined;
    let memo: string | null | undefined;
    if (body.memo === null) {
      memo = null;
    } else if (typeof body.memo === 'string') {
      memo = body.memo;
    } else {
      memo = undefined;
    }

    if (body.paymentMethodId && typeof body.paymentMethodId === 'string') {
      const pm = await prisma.paymentMethod.findFirst({
        where: {
          id: body.paymentMethodId,
          userId,
          type: { in: ['WHITEPAY_CRYPTO', 'CRYPTO'] },
        },
      });
      if (!pm) {
        return NextResponse.json(
          { error: 'Moyen de paiement introuvable' },
          { status: 400 }
        );
      }
      const details = pm.details as { address?: string; network?: string; targetCurrency?: string; memo?: string | null };
      if (!details?.address || typeof details.address !== 'string') {
        return NextResponse.json(
          { error: 'Adresse enregistrée invalide' },
          { status: 400 }
        );
      }
      walletAddress = details.address;
      if (typeof targetCurrency !== 'string' || !targetCurrency) {
        targetCurrency = details.targetCurrency;
      }
      if (typeof network !== 'string' || !network) {
        network = details.network;
      }
      if (memo === undefined && details.memo) {
        memo = details.memo;
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

    if (
      typeof targetCurrency !== 'string' ||
      typeof network !== 'string' ||
      !targetCurrency.trim() ||
      !network.trim()
    ) {
      return NextResponse.json(
        { error: 'Crypto et réseau requis' },
        { status: 400 }
      );
    }

    const targetCurrencyU = targetCurrency.toUpperCase();
    const networkU = network.toUpperCase();

    const supportedCrypto = getWhitepayCryptoByTicker(targetCurrencyU);
    if (!supportedCrypto) {
      return NextResponse.json(
        { error: `Crypto non supportée: ${targetCurrencyU}` },
        { status: 400 }
      );
    }

    if (!isUserPayoutTickerAllowed(targetCurrencyU)) {
      return NextResponse.json(
        {
          error: "USDT n'est plus proposé pour les retraits. Choisissez USDC sur le réseau Polygon.",
          code: 'CRYPTO_USDT_DISABLED',
        },
        { status: 400 }
      );
    }

    if (!isWhitepayCryptoNetworkSupported(targetCurrencyU, networkU)) {
      return NextResponse.json(
        { error: `Réseau ${networkU} non supporté pour ${targetCurrencyU}` },
        { status: 400 }
      );
    }

    targetCurrency = targetCurrencyU;
    network = networkU;

    if (typeof walletAddress !== 'string' || !walletAddress.trim()) {
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

    const withdrawalCheck = await checkWithdrawalLimit(userId, amountCents);
    if (!withdrawalCheck.allowed && !withdrawalCheck.requiresManualVerification) {
      return NextResponse.json(
        { error: `Limite de retrait mensuelle dépassée (utilisé : ${(withdrawalCheck.usedCents / 100).toFixed(2)}€, limite : ${(withdrawalCheck.limitCents! / 100).toFixed(2)}€)` },
        { status: 400 }
      );
    }
    const forceManualApproval = !!withdrawalCheck.requiresManualVerification;

    let networkFeeCents: number;
    try {
      networkFeeCents = await estimateNetworkFeeCents(targetCurrencyU, networkU);
    } catch (feeErr) {
      const message =
        feeErr instanceof WhitepayApiError
          ? formatWhitepayApiErrorMessage(feeErr)
          : feeErr instanceof Error
            ? feeErr.message
            : 'Devis indisponible';
      return NextResponse.json(
        { error: message, quoteUnavailable: true },
        { status: 502 }
      );
    }

    const fees = calculateWhitepayFees(amountCents, networkFeeCents);
    const amountEur = amountCents / 100;

    const travelRulePayload = toWhitepayTravelRule(travelRuleRaw, {
      name: user.name,
      email: user.email,
    });

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
    const shouldAutoApprove = !forceManualApproval && autoSettings.enabled && amountCents <= autoSettings.thresholdCents;

    if (shouldAutoApprove) {
      const orderId = generateOrderId();
      const fees = calculateWhitepayFees(amountCents, networkFeeCents);

      // Create payout in DB BEFORE calling WhitePay API (prevents orphaned payments)
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
          processingFeeCents: fees.processingFeeCents,
          networkFeeCents: fees.networkFeeCents,
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
      const actualNetworkFeeCents = parseWhitepayNetworkFeeCents(tx.fee);

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
          processingFeeCents: fees.processingFeeCents,
          networkFeeCents: actualNetworkFeeCents,
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

      return jsonWithAskReview(userId, { type: 'withdrawal', amount: amountCents }, {
        success: true,
        autoApproved: true,
        payout: {
          id: payout.id,
          orderId,
          status: internalStatus,
          amountCents,
          fees: {
            processingCents: fees.processingFeeCents,
            networkCents: actualNetworkFeeCents,
            totalCents: fees.processingFeeCents + actualNetworkFeeCents,
          },
          netCents: calculateWhitepayNetCents(amountCents),
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
    try {
      await PayoutLifecycle.onCreated(userId, payout.id, amountCents);
    } catch (freezeErr) {
      await prisma.payout.update({ where: { id: payout.id }, data: { status: 'FAILED', errorMessage: 'freeze_failed' } });
      if (freezeErr instanceof Error && freezeErr.message === 'INSUFFICIENT_AVAILABLE_BALANCE') {
        return NextResponse.json({ error: 'Solde insuffisant' }, { status: 409 });
      }
      throw freezeErr;
    }

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

    await notifyAdminsPayoutPendingApproval(
      payout.id,
      userId,
      amountCents,
      `${targetCurrency.toUpperCase()} (${network.toUpperCase()})`,
    );

    return jsonWithAskReview(userId, { type: 'withdrawal', amount: amountCents }, {
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
    if (error instanceof WhitepayApiError) {
      const wpError = error;
      const responseDataStr = wpError.responseData
        ? JSON.stringify(wpError.responseData, null, 2)
        : 'no response data';
      const clientMessage = formatWhitepayApiErrorMessage(wpError);
      console.error('[Whitepay PayoutRequest] WhitepayApiError:', {
        message: wpError.message,
        statusCode: wpError.statusCode,
        responseData: wpError.responseData,
      });
      return NextResponse.json(
        {
          error: clientMessage || 'Erreur API Whitepay',
          details: wpError.message,
          statusCode: wpError.statusCode,
          whitepayErrors:
            wpError.responseData &&
            typeof wpError.responseData === 'object' &&
            'errors' in wpError.responseData
              ? (wpError.responseData as { errors: unknown }).errors
              : wpError.responseData ?? null,
          whitepayResponse: wpError.responseData ?? null,
          whitepayResponseRaw: responseDataStr,
          quoteUnavailable: (wpError.statusCode ?? 500) >= 500,
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
