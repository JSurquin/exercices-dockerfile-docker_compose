import type { NextRequest } from 'next/server';
import { skinplaceService } from '@/lib/skinplace';
import { withPartnerApi } from '@/lib/partner-api/handler';
import {
  formatInventoryForPartner,
  partnerInventoryFetchFailed,
  partnerSuccess,
  partnerError,
} from '@/lib/partner-api/response';
import { prisma } from '~/prisma/prisma';

export async function GET(request: NextRequest) {
  return withPartnerApi(
    request,
    { endpoint: '/api/v1/partner/inventory', method: 'GET', scopes: ['read'] },
    async (_req, ctx) => {
      const user = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { steamId: true },
      });

      if (!user?.steamId) {
        return partnerError('VALIDATION_ERROR', 'Steam ID is not linked to this account', 400);
      }

      try {
        const inventory = await skinplaceService.getInventory(user.steamId);
        if (partnerInventoryFetchFailed(inventory)) {
          return partnerError('API_ERROR', 'Unable to fetch inventory from the trade provider', 502);
        }
        return partnerSuccess(formatInventoryForPartner(user.steamId, inventory));
      } catch {
        return partnerError('API_ERROR', 'Unable to fetch inventory from the trade provider', 502);
      }
    }
  );
}
