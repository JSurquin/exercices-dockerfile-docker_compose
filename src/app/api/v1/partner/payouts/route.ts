import type { NextRequest } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { canUserMakePayout } from '@/lib/kycaid';
import { checkWithdrawalLimit } from '@/lib/balance-service';
import { PayoutLifecycle } from '@/lib/payout-lifecycle';
import { notifyPayoutStatusChange } from '@/lib/partner-api/webhook-service';
import { withPartnerApi } from '@/lib/partner-api/handler';
import { partnerSuccess, partnerError, formatPayoutForPartner } from '@/lib/partner-api/response';
import { partnerPayoutSchema } from '@/lib/partner-api/schemas';
import { isUsablePartnerPaymentMethod } from '@/lib/partner-api/payout-guards';
import { readPartnerJsonBody, safeParsePartnerJson } from '@/lib/partner-api/validation';

const TRADE_NOT_CLAIMABLE = 'TRADE_NOT_CLAIMABLE';

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
        return partnerSuccess(formatPayoutForPartner(existingPayout, { already_exists: true }));
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

      let payout;
      try {
        payout = await prisma.$transaction(async (tx) => {
          const claimed = await tx.trade.updateMany({
            where: { id: tradeId, userId: ctx.userId, status: 'AVAILABLE' },
            data: { status: 'PAYOUT_PENDING' },
          });
          if (claimed.count !== 1) {
            throw new Error(TRADE_NOT_CLAIMABLE);
          }
          return tx.payout.create({
            data: {
              userId: ctx.userId,
              tradeId,
              amountCents: trade.netCents,
              paymentMethodId: paymentMethod.id,
              status: 'PENDING',
            },
            include: { paymentMethod: true },
          });
        });
      } catch (err) {
        if (err instanceof Error && err.message === TRADE_NOT_CLAIMABLE) {
          const raced = await prisma.payout.findFirst({
            where: {
              tradeId,
              userId: ctx.userId,
              status: { notIn: ['FAILED', 'CANCELLED'] },
            },
            include: { paymentMethod: true },
          });
          if (raced) {
            return partnerSuccess(formatPayoutForPartner(raced, { already_exists: true }));
          }
          return partnerError('VALIDATION_ERROR', 'Trade is not ready for payout', 400);
        }
        throw err;
      }

      try {
        await PayoutLifecycle.onCreated(ctx.userId, payout.id, trade.netCents);
      } catch (freezeErr) {
        await prisma.$transaction([
          prisma.payout.update({
            where: { id: payout.id },
            data: { status: 'FAILED', errorMessage: 'freeze_failed' },
          }),
          prisma.trade.update({
            where: { id: tradeId },
            data: { status: 'AVAILABLE' },
          }),
        ]);
        if (freezeErr instanceof Error && freezeErr.message === 'INSUFFICIENT_AVAILABLE_BALANCE') {
          return partnerError('VALIDATION_ERROR', 'Insufficient balance', 409);
        }
        throw freezeErr;
      }

      void notifyPayoutStatusChange(ctx.userId, {
        id: payout.id,
        status: payout.status,
        amountCents: payout.amountCents,
        tradeId: payout.tradeId,
      });

      return partnerSuccess(formatPayoutForPartner(payout));
    }
  );
}
