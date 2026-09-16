type GiveawayWithOptionalCount<T> = T & { _count?: { entries: number } };

export type PublicGiveawayLeaderboardRow = {
  username: string | null;
  avatar: string | null;
  entries: number;
  isYou: boolean;
};

type GiveawayEntryForViewer = {
  userId: string;
  ticketsUsed: number;
  user?: { steamUsername?: string | null; steamAvatar?: string | null } | null;
};

/**
 * Métadonnées publiques : pas de seed sur la liste ; détail = seed uniquement si le tirage a eu lieu (statut ≠ ACTIVE).
 * Supprime systématiquement le champ `entries` brut (les données utiles sont déjà dans myEntries / totalParticipants / leaderboard).
 */
export function redactGiveawayForPublic<T extends Record<string, unknown>>(
  g: T,
  mode: 'list' | 'detail'
): T {
  const { entries: _e, ...withoutEntries } = g;
  void _e;

  if (mode === 'list') {
    const { randomSeed: _r, ...rest } = withoutEntries;
    void _r;
    return rest as T;
  }
  if (g.status === 'ACTIVE' && 'randomSeed' in withoutEntries) {
    const { randomSeed: _r, ...rest } = withoutEntries;
    void _r;
    return rest as T;
  }
  return withoutEntries as T;
}

export const GIVEAWAY_PUBLIC_ENTRY_INCLUDE = {
  include: {
    user: {
      select: {
        steamUsername: true,
        steamAvatar: true,
      },
    },
  },
  orderBy: { ticketsUsed: 'desc' as const },
};

function buildPublicLeaderboard(
  entries: GiveawayEntryForViewer[] | undefined,
  viewerUserId?: string | null
): PublicGiveawayLeaderboardRow[] {
  if (!entries || entries.length === 0) return [];
  return [...entries]
    .sort((a, b) => b.ticketsUsed - a.ticketsUsed)
    .map((entry) => ({
      username: entry.user?.steamUsername ?? null,
      avatar: entry.user?.steamAvatar ?? null,
      entries: entry.ticketsUsed,
      isYou: Boolean(viewerUserId && entry.userId === viewerUserId),
    }));
}

export function enrichGiveawayForViewer<
  T extends {
    entries?: GiveawayEntryForViewer[];
    soldTickets: number;
    winnerId?: string | null;
    winners?: { rank: number; userId?: string; user?: { steamUsername?: string | null; steamAvatar?: string | null } | null }[];
  },
>(g: GiveawayWithOptionalCount<T>, viewerUserId?: string | null): T & {
  totalParticipants: number;
  totalEntries: number;
  myEntries: number;
  myChancePercent: number;
  leaderboard: PublicGiveawayLeaderboardRow[];
} {
  const totalParticipants = g._count?.entries ?? g.entries?.length ?? 0;
  const totalEntries = g.soldTickets;
  let myEntries = 0;
  if (viewerUserId && g.entries) {
    const row = g.entries.find((e) => e.userId === viewerUserId);
    myEntries = row?.ticketsUsed ?? 0;
  }
  const myChancePercent = totalEntries > 0 ? (100 * myEntries) / totalEntries : 0;
  const { _count, ...gWithoutCount } = g;
  void _count;
  return {
    ...gWithoutCount,
    totalParticipants,
    totalEntries,
    myEntries,
    myChancePercent: Math.round(myChancePercent * 100) / 100,
    leaderboard: buildPublicLeaderboard(g.entries, viewerUserId),
  } as T & {
    totalParticipants: number;
    totalEntries: number;
    myEntries: number;
    myChancePercent: number;
    leaderboard: PublicGiveawayLeaderboardRow[];
  };
}
