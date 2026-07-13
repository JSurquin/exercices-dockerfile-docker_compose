import type { NextRequest } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { canUserMakePayout } from '@/lib/kycaid';
import { checkWithdrawalLimit } from '@/lib/balance-service';
import { PayoutLifecycle } from '@/lib/payout-lifecycle';
import { notifyPayoutStatusChange } from '@/lib/partner-api/webhook-service';
import { withPartnerApi } from '@/lib/partner-api/handler';
import { partnerSuccess, partnerError } from '@/lib/partner-api/response';
import { partnerPayoutSchema } from '@/lib/partner-api/schemas';
import { safeParseJson } from '@/lib/validation/helpers';

export async function POST(request: NextRequest) {
  return withPartnerApi(
    request,
    { endpoint: '/api/v1/partner/payouts', method: 'POST', scopes: ['payout'] },
    async (req, ctx) => {
      const raw = await req.json();
      const parsed = safeParseJson(raw, partnerPayoutSchema, { errorStyle: 'successFalse' });
      if (!parsed.ok) return parsed.response;

      const { trade_id: tradeId } = parsed.data;

      const trade = await prisma.trade.findUnique({
        where: { id: tradeId },
        include: { user: true, items: true },
      });

      if (!trade || trade.userId !== ctx.userId) {
        return partnerError('NOT_FOUND', 'Vente non trouvée', 404);
      }

      if (trade.status !== 'AVAILABLE' && trade.status !== 'PAYOUT_PENDING') {
        return partnerError('VALIDATION_ERROR', 'La vente n\'est pas prête pour un retrait', 400);
      }

      const kycCheck = await canUserMakePayout(ctx.userId);
      if (!kycCheck.allowed) {
        return partnerError('KYC_REQUIRED', kycCheck.reason || 'KYC requis', 403, { requires_kyc: true });
      }

      if (trade.user.accountFrozen) {
        return partnerError('ACCOUNT_FROZEN', 'Compte gelé', 403);
      }

      const limitCheck = await checkWithdrawalLimit(ctx.userId, trade.netCents);
      if (!limitCheck.allowed) {
        return partnerError('FORBIDDEN', limitCheck.reason || 'Plafond mensuel dépassé', 403);
      }

      let payout = await prisma.payout.findFirst({
        where: {
          tradeId,
          userId: ctx.userId,
          status: { notIn: ['FAILED', 'CANCELLED'] },
        },
        include: { paymentMethod: true },
      });

      if (!payout) {
        let paymentMethod = await prisma.paymentMethod.findFirst({
          where: { userId: ctx.userId, isDefault: true },
        });

        if (!paymentMethod) {
          paymentMethod = await prisma.paymentMethod.create({
            data: {
              userId: ctx.userId,
              type: 'SEPA',
              details: {},
              isDefault: true,
              isVerified: false,
            },
          });
        }

        payout = await prisma.payout.create({
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
            return partnerError('VALIDATION_ERROR', 'Solde insuffisant', 409);
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
      }

      return partnerSuccess({
        id: payout.id,
        statut: payout.status.toLowerCase(),
        amount_centimes: payout.amountCents,
        trade_id: trade.id,
        payment_method: {
          type: payout.paymentMethod.type,
          verified: payout.paymentMethod.isVerified,
        },
        reference_paiement: payout.id,
      });
    }
  );
}
