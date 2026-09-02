import type { NextRequest } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { withPartnerApi } from '@/lib/partner-api/handler';
import { partnerSuccess, partnerError, mapKycStatus } from '@/lib/partner-api/response';
import { withPartnerTrace } from '@/lib/partner-api/trace';

export async function GET(request: NextRequest) {
  return withPartnerTrace(request, '/api/v1/partner/me', 'GET', () =>
    withPartnerApi(request, { endpoint: '/api/v1/partner/me', method: 'GET', scopes: ['read'] }, async (_req, ctx) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        id: true,
        steamId: true,
        steamUsername: true,
        kycStatus: true,
        acceptedTermsAt: true,
        tradeLink: true,
        userTag: true,
        accountFrozen: true,
        createdAt: true,
      },
    });

    if (!user) {
      return partnerError('NOT_FOUND', 'Account not found', 404);
    }

    return partnerSuccess({
      id: user.id,
      steam_id: user.steamId,
      steam_username: user.steamUsername,
      kyc_status: mapKycStatus(user.kycStatus),
      accepted_terms_at: user.acceptedTermsAt?.toISOString() ?? null,
      trade_link: user.tradeLink,
      user_tag: user.userTag,
      account_frozen: user.accountFrozen,
      created_at: user.createdAt.toISOString(),
    });
  })
  );
}
