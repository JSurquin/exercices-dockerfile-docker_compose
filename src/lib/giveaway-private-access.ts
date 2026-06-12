import type { NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '~/prisma/prisma';
import { normalizeAffiliateCode } from '@/lib/affiliate-commission-logic';

export function parseAffiliateRefFromRequest(request: NextRequest): string | null {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const affiliateCookie = cookieHeader
    .split(';')
    .find((c) => c.trim().startsWith('ctf_affiliate_ref='))
    ?.split('=')[1]
    ?.trim();
  const refParam = new URL(request.url).searchParams.get('ref');
  return refParam ?? affiliateCookie ?? null;
}

export function affiliateCodesMatch(
  ref: string | null | undefined,
  requiredCode: string | null | undefined
): boolean {
  if (!ref || !requiredCode) return false;
  return normalizeAffiliateCode(ref) === normalizeAffiliateCode(requiredCode);
}

/** Filtres Prisma pour la liste publique des giveaways visibles par un visiteur. */
export function buildGiveawayVisibilityOr(
  affiliateRef: string | null,
  viewerUserId: string | null,
  viewerIsAdmin = false
): Prisma.GiveawayWhereInput[] {
  if (viewerIsAdmin) {
    return [{}];
  }

  const accessOr: Prisma.GiveawayWhereInput[] = [
    { isPrivate: false },
    { isPrivate: true, requiredAffiliateCode: null },
  ];

  if (affiliateRef) {
    accessOr.push({
      isPrivate: true,
      requiredAffiliateCode: {
        equals: affiliateRef.trim(),
        mode: 'insensitive',
      },
    });
  }

  if (viewerUserId) {
    accessOr.push({
      affiliateGiveawayRequest: {
        OR: [
          { userId: viewerUserId },
          { affiliate: { userId: viewerUserId, isActive: true } },
        ],
      },
    });
  }

  return accessOr;
}

export async function canAccessPrivateGiveaway(input: {
  giveaway: {
    id: string;
    isPrivate: boolean;
    requiredAffiliateCode: string | null;
  };
  affiliateRef: string | null;
  viewerUserId: string | null;
  viewerIsAdmin?: boolean;
}): Promise<boolean> {
  const { giveaway, affiliateRef, viewerUserId, viewerIsAdmin = false } = input;

  if (viewerIsAdmin) {
    return true;
  }

  if (!giveaway.isPrivate || !giveaway.requiredAffiliateCode) {
    return true;
  }

  if (affiliateCodesMatch(affiliateRef, giveaway.requiredAffiliateCode)) {
    return true;
  }

  if (!viewerUserId) {
    return false;
  }

  const ownerAccess = await prisma.affiliateGiveawayRequest.findFirst({
    where: {
      giveawayId: giveaway.id,
      userId: viewerUserId,
    },
    select: { id: true },
  });
  if (ownerAccess) return true;

  const affiliateOwner = await prisma.affiliateStats.findFirst({
    where: {
      userId: viewerUserId,
      isActive: true,
      code: {
        equals: giveaway.requiredAffiliateCode,
        mode: 'insensitive',
      },
    },
    select: { id: true },
  });

  return !!affiliateOwner;
}
