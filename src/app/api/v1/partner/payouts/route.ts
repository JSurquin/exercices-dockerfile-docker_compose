import type { NextRequest } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { canUserMakePayout } from '@/lib/kycaid';
import { checkWithdrawalLimit } from '@/lib/balance-service';
import { PayoutLifecycle } from '@/lib/payout-lifecycle';
import { notifyPayoutStatusChange } from '@/lib/partner-api/webhook-service';
import { withPartnerApi } from '@/lib/partner-api/handler';
import { partnerSuccess, partnerError, mapPayoutStatus } from '@/lib/partner-api/response';
import { partnerPayoutSchema } from '@/lib/partner-api/schemas';
import { isUsablePartnerPaymentMethod } from '@/lib/partner-api/payout-guards';
import { readPartnerJsonBody, safeParsePartnerJson } from '@/lib/partner-api/validation';

export async function POST(request: NextRequest) {
  return withPartnerApi(
    request,
    { endpoint: '/api/v1/partner/payouts', method: 'POST', scopes: ['payout'] },
    async (req, ctx) => {
      const raw = await readPartnerJsonBody(req);
      if (!raw.ok) return raw.response;

      const parsed = safeParsePartnerJson(raw.data, partnerPayoutSchema);
      if (!parsed.ok) return parsed.response;

      const { trade_id: tradeId } = parsed.data;

      const trade = await prisma.trade.findUnique({
        where: { id: tradeId },
        include: { user: true, items: true },
      });

      if (!trade || trade.userId !== ctx.userId) {
        return partnerError('NOT_FOUND', 'Trade not found', 404);
      }

      const existingPayout = await prisma.payout.findFirst({
        where: {
          tradeId,
          userId: ctx.userId,
          status: { notIn: ['FAILED', 'CANCELLED'] },
        },
        include: { paymentMethod: true },
      });

      if (existingPayout) {
        return partnerSuccess({
          id: existingPayout.id,
          status: mapPayoutStatus(existingPayout.status),
          amount_cents: existingPayout.amountCents,
          trade_id: trade.id,
          payment_method: {
            type: existingPayout.paymentMethod.type,
            verified: existingPayout.paymentMethod.isVerified,
          },
          payment_reference: existingPayout.id,
        });
      }

      if (trade.status !== 'AVAILABLE') {
        return partnerError('VALIDATION_ERROR', 'Trade is not ready for payout', 400);
      }

      const kycCheck = await canUserMakePayout(ctx.userId);
      if (!kycCheck.allowed) {
        return partnerError('KYC_REQUIRED', kycCheck.reason || 'KYC verification required', 403, {
          requires_kyc: true,
        });
      }

      if (trade.user.accountFrozen) {
        return partnerError('ACCOUNT_FROZEN', 'Account frozen', 403);
      }

      const limitCheck = await checkWithdrawalLimit(ctx.userId, trade.netCents);
      if (!limitCheck.allowed) {
        return partnerError('FORBIDDEN', limitCheck.reason || 'Monthly withdrawal limit exceeded', 403);
      }

      const paymentMethod = await prisma.paymentMethod.findFirst({
        where: { userId: ctx.userId, isDefault: true },
      });

      if (!paymentMethod || !isUsablePartnerPaymentMethod(paymentMethod)) {
        return partnerError(
          'VALIDATION_ERROR',
          'No payout method configured. Add a SEPA or crypto method in the dashboard first.',
          400
        );
      }

      const payout = await prisma.payout.create({
        data: {
          userId: ctx.userId,
          tradeId,
          amountCents: trade.netCents,
          paymentMethodId: paymentMethod.id,
          status: 'PENDING',
        },
        include: { paymentMethod: true },
      });

      try {
        await PayoutLifecycle.onCreated(ctx.userId, payout.id, trade.netCents);
      } catch (freezeErr) {
        await prisma.payout.update({
          where: { id: payout.id },
          data: { status: 'FAILED', errorMessage: 'freeze_failed' },
        });
        if (freezeErr instanceof Error && freezeErr.message === 'INSUFFICIENT_AVAILABLE_BALANCE') {
          return partnerError('VALIDATION_ERROR', 'Insufficient balance', 409);
        }
        throw freezeErr;
      }

      await prisma.trade.update({
        where: { id: tradeId },
        data: { status: 'PAYOUT_PENDING' },
      });

      void notifyPayoutStatusChange(ctx.userId, {
        id: payout.id,
        status: payout.status,
        amountCents: payout.amountCents,
        tradeId: payout.tradeId,
      });

      return partnerSuccess({
        id: payout.id,
        status: mapPayoutStatus(payout.status),
        amount_cents: payout.amountCents,
        trade_id: trade.id,
        payment_method: {
          type: payout.paymentMethod.type,
          verified: payout.paymentMethod.isVerified,
        },
        payment_reference: payout.id,
      });
    }
  );
}
