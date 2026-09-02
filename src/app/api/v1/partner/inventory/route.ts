import type { NextRequest } from 'next/server';
import { withPartnerApi } from '@/lib/partner-api/handler';
import { formatInventoryForPartner, partnerSuccess, partnerError } from '@/lib/partner-api/response';
import {
  fetchSkinplaceInstantInventory,
  isSkinplaceItemSellable,
} from '@/lib/skinplace-instant-inventory';
import { getPartnerOperatingSteamId } from '@/lib/partner-api/trade-url-validation';
import { partnerTrace, withPartnerTrace } from '@/lib/partner-api/trace';
import { prisma } from '~/prisma/prisma';

export async function GET(request: NextRequest) {
  return withPartnerTrace(request, '/api/v1/partner/inventory', 'GET', () =>
    withPartnerApi(
      request,
      { endpoint: '/api/v1/partner/inventory', method: 'GET', scopes: ['read'] },
      async (_req, ctx) => {
        partnerTrace('inventory.user.lookup', { userId: ctx.userId });
        const user = await prisma.user.findUnique({
          where: { id: ctx.userId },
          select: { steamId: true, tradeLink: true },
        });

        const steamId = user ? getPartnerOperatingSteamId(user) : null;
        if (!steamId) {
          partnerTrace('inventory.no-steam');
          return partnerError('VALIDATION_ERROR', 'Steam ID is not linked to this account', 400);
        }

        partnerTrace('inventory.steam', { steamId });
        const fetched = await fetchSkinplaceInstantInventory(steamId);
        if (!fetched.ok) {
          partnerTrace('inventory.skinplace.fail', { code: fetched.code });
          return partnerError(fetched.code, fetched.error, 502);
        }

        const sellable = fetched.inventory.filter(isSkinplaceItemSellable);
        partnerTrace('inventory.format', {
          raw: fetched.inventory.length,
          sellable: sellable.length,
        });
        return partnerSuccess(formatInventoryForPartner(steamId, { inventory: sellable }));
      }
    )
  );
}
