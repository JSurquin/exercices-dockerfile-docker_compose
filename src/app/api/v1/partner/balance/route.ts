import type { NextRequest } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { withPartnerApi } from '@/lib/partner-api/handler';
import { partnerSuccess, partnerError } from '@/lib/partner-api/response';
import { withPartnerTrace } from '@/lib/partner-api/trace';

export async function GET(request: NextRequest) {
  return withPartnerTrace(request, '/api/v1/partner/balance', 'GET', () =>
    withPartnerApi(
    request,
    { endpoint: '/api/v1/partner/balance', method: 'GET', scopes: ['read'] },
    async (_req, ctx) => {
      const user = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: {
          balanceCents: true,
          pendingBalanceCents: true,
          frozenBalanceCents: true,
          accountFrozen: true,
        },
      });

      if (!user) {
        return partnerError('NOT_FOUND', 'Account not found', 404);
      }

      const available = user.balanceCents - user.frozenBalanceCents;

      return partnerSuccess({
        balance_cents: user.balanceCents,
        pending_cents: user.pendingBalanceCents,
        frozen_cents: user.frozenBalanceCents,
        available_cents: Math.max(0, available),
        account_frozen: user.accountFrozen,
      });
    }
  )
  );
}
