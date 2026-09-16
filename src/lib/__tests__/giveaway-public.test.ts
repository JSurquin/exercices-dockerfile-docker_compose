import { enrichGiveawayForViewer, redactGiveawayForPublic } from '@/lib/giveaway-public';

describe('enrichGiveawayForViewer leaderboard', () => {
  it('builds a public ranking without user ids and marks the viewer', () => {
    const enriched = enrichGiveawayForViewer(
      {
        soldTickets: 5,
        entries: [
          {
            userId: 'u2',
            ticketsUsed: 2,
            user: { steamUsername: 'Ada', steamAvatar: 'a.png' },
          },
          {
            userId: 'u1',
            ticketsUsed: 3,
            user: { steamUsername: 'Kitsu', steamAvatar: 'k.png' },
          },
        ],
        _count: { entries: 2 },
      },
      'u1'
    );

    expect(enriched.totalParticipants).toBe(2);
    expect(enriched.myEntries).toBe(3);
    expect(enriched.leaderboard).toEqual([
      { username: 'Kitsu', avatar: 'k.png', entries: 3, isYou: true },
      { username: 'Ada', avatar: 'a.png', entries: 2, isYou: false },
    ]);
    expect(JSON.stringify(enriched.leaderboard)).not.toContain('u1');
  });
});

describe('redactGiveawayForPublic', () => {
  it('strips raw entries while keeping the public leaderboard', () => {
    const redacted = redactGiveawayForPublic(
      {
        status: 'ACTIVE',
        entries: [{ userId: 'u1', ticketsUsed: 1 }],
        leaderboard: [{ username: 'Kitsu', avatar: null, entries: 1, isYou: true }],
        randomSeed: 'secret',
      },
      'list'
    );
    expect(redacted).not.toHaveProperty('entries');
    expect(redacted).not.toHaveProperty('randomSeed');
    expect(redacted.leaderboard).toHaveLength(1);
  });
});
