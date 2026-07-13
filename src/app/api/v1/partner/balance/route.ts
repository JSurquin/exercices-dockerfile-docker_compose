import type { NextRequest } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { withPartnerApi } from '@/lib/partner-api/handler';
import { partnerSuccess, partnerError } from '@/lib/partner-api/response';

export async function GET(request: NextRequest) {
  return withPartnerApi(
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
        return partnerError('NOT_FOUND', 'Compte non trouvé', 404);
      }

      const available = user.balanceCents - user.frozenBalanceCents;

      return partnerSuccess({
        balance_centimes: user.balanceCents,
        pending_centimes: user.pendingBalanceCents,
        frozen_centimes: user.frozenBalanceCents,
        available_centimes: Math.max(0, available),
        account_frozen: user.accountFrozen,
      });
    }
  );
}
