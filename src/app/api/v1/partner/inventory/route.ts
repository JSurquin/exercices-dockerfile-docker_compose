import type { NextRequest } from 'next/server';
import { withPartnerApi } from '@/lib/partner-api/handler';
import { formatInventoryForPartner, partnerSuccess, partnerError } from '@/lib/partner-api/response';
import {
  fetchSkinplaceInstantInventory,
  isSkinplaceItemSellable,
  mapSkinplaceInventoryFailure,
} from '@/lib/skinplace-instant-inventory';
import { resolvePartnerOperatingSteamId } from '@/lib/partner-api/trade-url-validation';
import { parseOptionalPartnerTradeUrl, parsePartnerCurrencyParam } from '@/lib/partner-api/validation';
import { convertPartnerInventoryCurrency } from '@/lib/partner-api/currency';
import { partnerTrace, withPartnerTrace } from '@/lib/partner-api/trace';
import { prisma } from '~/prisma/prisma';

export async function GET(request: NextRequest) {
  return withPartnerTrace(request, '/api/v1/partner/inventory', 'GET', () =>
    withPartnerApi(
      request,
      { endpoint: '/api/v1/partner/inventory', method: 'GET', scopes: ['read'] },
      async (req, ctx) => {
        const searchParams = new URL(req.url).searchParams;
        const tradeUrl = parseOptionalPartnerTradeUrl(searchParams);
        if (!tradeUrl.ok) return tradeUrl.response;
        const currency = parsePartnerCurrencyParam(searchParams);
        if (!currency.ok) return currency.response;

        partnerTrace('inventory.user.lookup', { userId: ctx.userId, hasTradeUrl: Boolean(tradeUrl.data) });
        const user = await prisma.user.findUnique({
          where: { id: ctx.userId },
          select: { steamId: true, tradeLink: true },
        });

        const resolved = resolvePartnerOperatingSteamId(user, tradeUrl.data);
        if (!resolved.ok) {
          partnerTrace('inventory.no-steam');
          return partnerError('VALIDATION_ERROR', resolved.error, 400);
        }

        partnerTrace('inventory.steam', { steamId: resolved.steamId });
        const fetched = await fetchSkinplaceInstantInventory(resolved.steamId);
        if (!fetched.ok) {
          const mapped = mapSkinplaceInventoryFailure(fetched);
          partnerTrace('inventory.skinplace.fail', {
            code: mapped.code,
            status: mapped.httpStatus,
            providerStatus: fetched.provider?.status,
            providerError: fetched.provider?.error_message,
          });
          return partnerError(mapped.code, mapped.message, mapped.httpStatus, mapped.extra);
        }

        const sellable = fetched.inventory.filter(isSkinplaceItemSellable);
        partnerTrace('inventory.format', {
          raw: fetched.inventory.length,
          sellable: sellable.length,
          currency: currency.data,
        });
        const inventory = await convertPartnerInventoryCurrency(
          formatInventoryForPartner(resolved.steamId, { inventory: sellable }),
          currency.data
        );
        return partnerSuccess(inventory);
      }
    )
  );
}
