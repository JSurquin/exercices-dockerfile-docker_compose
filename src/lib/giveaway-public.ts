type GiveawayWithOptionalCount<T> = T & { _count?: { entries: number } };

/**
 * Métadonnées publiques : pas de seed sur la liste ; détail = seed uniquement si le tirage a eu lieu (statut ≠ ACTIVE).
 * Supprime systématiquement le champ `entries` brut (les données utiles sont déjà dans myEntries / totalParticipants).
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

export function enrichGiveawayForViewer<
  T extends {
    entries?: { userId: string; ticketsUsed: number }[];
    soldTickets: number;
    winnerId?: string | null;
    winners?: { rank: number; userId?: string; user?: { steamUsername?: string | null; steamAvatar?: string | null } | null }[];
  },
>(g: GiveawayWithOptionalCount<T>, viewerUserId?: string | null): T & {
  totalParticipants: number;
  totalEntries: number;
  myEntries: number;
  myChancePercent: number;
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
  } as T & {
    totalParticipants: number;
    totalEntries: number;
    myEntries: number;
    myChancePercent: number;
  };
}
