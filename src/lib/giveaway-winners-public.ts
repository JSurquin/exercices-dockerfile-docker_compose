import { prisma } from '~/prisma/prisma';

type WinnerRow = { userId: string; rank: number };

type PublicWinners = { rank: number; user: { steamUsername: string | null; steamAvatar: string | null } }[];

/**
 * Remplace les gagnants { userId, rank } par { rank, user: { steamUsername, steamAvatar } } sans fuite d'ID.
 * Un seul batch d'utilisateurs pour des listes de giveaways.
 */
export async function withPublicWinnerProfiles<T extends { winners: WinnerRow[] }>(list: T[]) {
  const ids = [
    ...new Set(list.flatMap((g) => (g.winners?.length ? g.winners.map((w) => w.userId) : []))),
  ];
  const users =
    ids.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: ids } },
          select: { id: true, steamUsername: true, steamAvatar: true },
        })
      : [];
  const m = new Map(users.map((u) => [u.id, u]));
  return list.map((g) => {
    const winners: PublicWinners = (g.winners ?? []).map((w) => {
      const u = m.get(w.userId);
      return {
        rank: w.rank,
        user: {
          steamUsername: u?.steamUsername ?? null,
          steamAvatar: u?.steamAvatar ?? null,
        },
      };
    });
    return { ...g, winners };
  });
}

export async function withPublicWinnerProfile<T extends { winners: WinnerRow[] }>(g: T) {
  const [one] = await withPublicWinnerProfiles([g]);
  return one;
}
