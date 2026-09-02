import type { NextRequest } from 'next/server';
import { withPartnerApi } from '@/lib/partner-api/handler';
import { formatInventoryForPartner, partnerSuccess, partnerError } from '@/lib/partner-api/response';
import {
  fetchSkinplaceInstantInventory,
  isSkinplaceItemSellable,
} from '@/lib/skinplace-instant-inventory';
import { getPartnerOperatingSteamId } from '@/lib/partner-api/trade-url-validation';
import { prisma } from '~/prisma/prisma';

export async function GET(request: NextRequest) {
  return withPartnerApi(
    request,
    { endpoint: '/api/v1/partner/inventory', method: 'GET', scopes: ['read'] },
    async (_req, ctx) => {
      const user = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { steamId: true, tradeLink: true },
      });

      const steamId = user ? getPartnerOperatingSteamId(user) : null;
      if (!steamId) {
        return partnerError('VALIDATION_ERROR', 'Steam ID is not linked to this account', 400);
      }

      const fetched = await fetchSkinplaceInstantInventory(steamId);
      if (!fetched.ok) {
        return partnerError(fetched.code, fetched.error, 502);
      }

      const sellable = fetched.inventory.filter(isSkinplaceItemSellable);
      return partnerSuccess(formatInventoryForPartner(steamId, { inventory: sellable }));
    }
  );
}
