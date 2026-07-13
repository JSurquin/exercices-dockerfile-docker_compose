import type { NextRequest } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { withPartnerApi } from '@/lib/partner-api/handler';
import { partnerSuccess, partnerError, formatTradeForPartner } from '@/lib/partner-api/response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return withPartnerApi(
    request,
    { endpoint: '/api/v1/partner/trades/{id}', method: 'GET', scopes: ['read'] },
    async (_req, ctx) => {
      const trade = await prisma.trade.findFirst({
        where: { id, userId: ctx.userId },
        include: { items: true },
      });

      if (!trade) {
        return partnerError('NOT_FOUND', 'Vente non trouvée', 404);
      }

      return partnerSuccess(formatTradeForPartner(trade));
    }
  );
}
