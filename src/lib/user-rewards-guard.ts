import { prisma } from '../../prisma/prisma';

export type UserRewardFlags = {
  affiliateRewardsBlocked: boolean;
  xpRewardsBlocked: boolean;
};

/**
 * Flags anti-abus par profil (VIP/merchant référé, etc.).
 * Utilisé avant toute attribution de commission affilié ou de XP/fragments.
 */
export async function getUserRewardFlags(userId: string): Promise<UserRewardFlags> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { affiliateRewardsBlocked: true, xpRewardsBlocked: true },
  });
  return {
    affiliateRewardsBlocked: user?.affiliateRewardsBlocked ?? false,
    xpRewardsBlocked: user?.xpRewardsBlocked ?? false,
  };
}

export function isAffiliateRewardsBlocked(flags: UserRewardFlags): boolean {
  return flags.affiliateRewardsBlocked;
}

export function isXpRewardsBlocked(flags: UserRewardFlags): boolean {
  return flags.xpRewardsBlocked;
}
