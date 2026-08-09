import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '~/prisma/prisma';
import { canUserMakePayout } from '@/lib/kycaid';
import { getBalance, checkWithdrawalLimit } from '@/lib/balance-service';
import { validateAmountCents } from '@/lib/amount-validation';
import { safeParseJson } from '@/lib/validation/helpers';
import { merchantWithdrawBodySchema } from '@/lib/validation/schemas/merchant-withdraw';
import { RateLimiter, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';
import { verifyMutationOrigin } from '@/lib/csrf-mutation-guard';
import { notifyAdminsPayoutPendingApproval } from '@/lib/admin-notification-hooks';
import {
  assertMerchantUser,
  createMerchantWithdrawRequest,
  maskMerchantWithdrawDetails,
  MerchantWithdrawForbiddenError,
  MERCHANT_WITHDRAW_MIN_CENTS,
  MERCHANT_WITHDRAW_MAX_CENTS,
  validateMerchantWithdrawDetails,
  type MerchantWithdrawDetails,
} from '@/lib/merchant-withdraw';
import { getClientIP } from '@/lib/security/audit-helpers';

const payoutRateLimiter = new RateLimiter('PAYOUT_MERCHANT_WITHDRAW', RATE_LIMIT_CONFIGS.PAYOUT_REQUEST);

export async function POST(request: NextRequest) {
  try {
    const csrfBlock = verifyMutationOrigin(request);
    if (csrfBlock) return csrfBlock;

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = session.user.id;

    try {
      await assertMerchantUser(userId);
    } catch (err) {
      if (err instanceof MerchantWithdrawForbiddenError) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
      throw err;
    }

    const frozenCheck = await prisma.user.findUnique({
      where: { id: userId },
      select: { accountFrozen: true, banned: true },
    });
    if (frozenCheck?.accountFrozen || frozenCheck?.banned) {
      return NextResponse.json({ error: 'Votre compte est suspendu. Contactez le support.' }, { status: 403 });
    }

    const kycCheck = await canUserMakePayout(userId);
    if (!kycCheck.allowed) {
      return NextResponse.json({ error: kycCheck.reason, code: 'KYC_REQUIRED' }, { status: 403 });
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, merchantWithdrawBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    const amountCents = validateAmountCents(parsed.data.amountCents);
    if (amountCents === null) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }
    if (amountCents < MERCHANT_WITHDRAW_MIN_CENTS) {
      return NextResponse.json({ error: 'Montant minimum : 10 €' }, { status: 400 });
    }
    if (amountCents > MERCHANT_WITHDRAW_MAX_CENTS) {
      return NextResponse.json({ error: 'Montant maximum dépassé' }, { status: 400 });
    }

    const details: MerchantWithdrawDetails =
      parsed.data.subtype === 'bank'
        ? {
            subtype: 'bank',
            accountHolder: parsed.data.accountHolder,
            iban: parsed.data.iban,
            bic: parsed.data.bic,
            country: parsed.data.country.toUpperCase(),
          }
        : {
            subtype: 'crypto',
            asset: parsed.data.asset,
            network: parsed.data.network,
            address: parsed.data.address,
            memo: parsed.data.memo,
          };

    const validation = validateMerchantWithdrawDetails(details);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const balance = await getBalance(userId);
    if (amountCents > balance.availableCents) {
      return NextResponse.json({ error: 'Solde insuffisant' }, { status: 400 });
    }

    const withdrawalCheck = await checkWithdrawalLimit(userId, amountCents);
    if (!withdrawalCheck.allowed && !withdrawalCheck.requiresManualVerification) {
      return NextResponse.json({ error: withdrawalCheck.reason }, { status: 403 });
    }

    const paymentMethodType = details.subtype === 'bank' ? 'SEPA' : 'CRYPTO';
    let paymentMethod = await prisma.paymentMethod.findFirst({
      where: { userId, type: paymentMethodType },
    });
    if (!paymentMethod) {
      paymentMethod = await prisma.paymentMethod.create({
        data: {
          userId,
          type: paymentMethodType,
          details: maskMerchantWithdrawDetails(details) as object,
          isVerified: true,
        },
      });
    }

    const { SecurityService } = await import('@/lib/security-service');
    const securityService = new SecurityService();
    const ipAddress = getClientIP(request);
    const secCheck = await securityService.checkPayoutEligibility(
      userId,
      amountCents,
      paymentMethod.id,
      ipAddress,
    );
    if (!secCheck.allowed && !secCheck.requiresManualVerification) {
      return NextResponse.json({ error: secCheck.reason }, { status: 403 });
    }

    const rateCheck = await payoutRateLimiter.checkLimit(request, userId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Trop de requêtes. Réessayez plus tard.' },
        { status: 429 },
      );
    }

    const idempotencyKey = request.headers.get('idempotency-key') ?? undefined;

    let result;
    try {
      result = await createMerchantWithdrawRequest({
        userId,
        amountCents,
        details,
        idempotencyKey,
        paymentMethodId: paymentMethod.id,
      });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'INSUFFICIENT_AVAILABLE_BALANCE') {
          return NextResponse.json({ error: 'Solde insuffisant' }, { status: 409 });
        }
        if (err.message === 'MAX_PENDING_REACHED') {
          return NextResponse.json(
            { error: 'Limite de demandes en attente atteinte. Annulez ou attendez le traitement des demandes existantes.' },
            { status: 409 },
          );
        }
      }
      throw err;
    }

    if (result.created) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'MERCHANT_WITHDRAW_REQUESTED',
          details: {
            payoutId: result.payoutId,
            reference: result.reference,
            amountCents,
            subtype: details.subtype,
            masked: maskMerchantWithdrawDetails(details),
          },
        },
      });

      await notifyAdminsPayoutPendingApproval(result.payoutId, userId, amountCents, 'Merchant Withdraw');
    }

    return NextResponse.json({
      success: true,
      pendingApproval: true,
      message: 'Demande enregistrée. Notre équipe traitera votre retrait manuellement.',
      payout: {
        id: result.payoutId,
        reference: result.reference,
        status: 'PENDING_APPROVAL',
        amountCents,
        fees: { processingCents: 0, networkCents: 0, totalCents: 0 },
        netCents: amountCents,
        method: 'MERCHANT_WITHDRAW',
        subtype: details.subtype,
      },
    });
  } catch (error) {
    console.error('[MERCHANT_WITHDRAW] POST error', error);
    return NextResponse.json({ error: 'Erreur lors de la création de la demande' }, { status: 500 });
  }
}
