import type { NextRequest } from 'next/server';
import { skinplaceService, handleSkinplaceError } from '@/lib/skinplace';
import { withPartnerApi } from '@/lib/partner-api/handler';
import { partnerSuccess, partnerError } from '@/lib/partner-api/response';
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
        return partnerError('VALIDATION_ERROR', 'Steam ID non lié au compte', 400);
      }

      try {
        const inventory = await skinplaceService.getInventory(user.steamId);
        return partnerSuccess(inventory);
      } catch (error) {
        const skinplaceError = handleSkinplaceError(error);
        return partnerError('INTERNAL_ERROR', skinplaceError.error || 'Erreur inventaire', 502);
      }
    }
  );
}
