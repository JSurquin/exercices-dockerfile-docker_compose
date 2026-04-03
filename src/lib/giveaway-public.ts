export function enrichGiveawayForViewer<T extends { entries?: { userId: string; ticketsUsed: number }[]; soldTickets: number; winnerId?: string | null; winners?: { userId: string; rank: number }[] }>(
  g: T,
  viewerUserId?: string | null
): T & {
  totalParticipants: number;
  totalEntries: number;
  myEntries: number;
  myChancePercent: number;
} {
  const totalParticipants = g.entries?.length ?? 0;
  const totalEntries = g.soldTickets;
  let myEntries = 0;
  if (viewerUserId && g.entries) {
    const row = g.entries.find((e) => e.userId === viewerUserId);
    myEntries = row?.ticketsUsed ?? 0;
  }
  const myChancePercent = totalEntries > 0 ? (100 * myEntries) / totalEntries : 0;
  return {
    ...g,
    totalParticipants,
    totalEntries,
    myEntries,
    myChancePercent: Math.round(myChancePercent * 100) / 100,
  };
}
