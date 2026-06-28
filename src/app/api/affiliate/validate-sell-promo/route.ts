import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { AffiliateService } from '@/lib/affiliate-service';
import { isMerchantAccount } from '@/lib/user-rewards-guard';
import { prisma } from '~/prisma/prisma';

/**
 * Vérifie qu’un code saisi sur /sell correspond à un affilié actif
 * (même code que le lien affilié).
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ valid: false, error: 'unauthorized' }, { status: 401 });
  }

  const code = request.nextUrl.searchParams.get('code')?.trim() ?? '';
  if (!code) {
    return NextResponse.json({ valid: false, error: 'empty' });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { userTag: true },
  });
  if (isMerchantAccount(user)) {
    return NextResponse.json({ valid: false, error: 'merchant' });
  }

  const result = await AffiliateService.validateAffiliateSellPromoCode(session.user.id, code);
  if (!result.ok) {
    return NextResponse.json({ valid: false, error: result.error });
  }

  const bindResult = await AffiliateService.bindUserToAffiliateForSellPromo(
    session.user.id,
    result.affiliateId
  );

  return NextResponse.json({
    valid: true,
    code: result.code,
    alreadyLinked: result.alreadyLinked || bindResult.alreadyLinked,
    alreadyLinkedToOther: result.alreadyLinkedToOther,
    attached: bindResult.attached,
    affiliateName: bindResult.affiliateName || result.affiliateName,
  });
}
