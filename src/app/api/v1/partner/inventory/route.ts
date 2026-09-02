import type { NextRequest } from 'next/server';
import { withPartnerApi } from '@/lib/partner-api/handler';
import { formatInventoryForPartner, partnerSuccess, partnerError } from '@/lib/partner-api/response';
import {
  fetchSkinplaceInstantInventory,
  isSkinplaceItemSellable,
} from '@/lib/skinplace-instant-inventory';
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

      const fetched = await fetchSkinplaceInstantInventory(user.steamId);
      if (!fetched.ok) {
        return partnerError(fetched.code, fetched.error, 502);
      }

      const sellable = fetched.inventory.filter(isSkinplaceItemSellable);
      return partnerSuccess(formatInventoryForPartner(user.steamId, { inventory: sellable }));
    }
  );
}
