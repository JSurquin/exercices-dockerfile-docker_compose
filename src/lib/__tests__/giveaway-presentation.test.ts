import {
  filterGiveawaysByTier,
  getGiveawayTier,
  getPrizeHaloColor,
  getPrizeValueCents,
  getTimeRemaining,
  parsePrizeDisplay,
  selectFeaturedGiveaway,
  sortGiveaways,
  type GiveawayPresentationInput,
} from '@/lib/giveaway-presentation';

function giveaway(
  overrides: Partial<GiveawayPresentationInput> & Pick<GiveawayPresentationInput, 'id'>
): GiveawayPresentationInput {
  return {
    ticketPrice: 10,
    prize: 'AK-47 | Redline (Field-Tested)',
    endDate: '2026-09-20T12:00:00.000Z',
    status: 'ACTIVE',
    isPrivate: false,
    ...overrides,
  };
}

describe('getPrizeValueCents', () => {
  it('returns null when missing or non-positive', () => {
    expect(getPrizeValueCents({})).toBeNull();
    expect(getPrizeValueCents({ rewardValueCents: 0 })).toBeNull();
    expect(getPrizeValueCents({ rewardValueCents: -5 })).toBeNull();
  });

  it('returns the floor value when present', () => {
    expect(getPrizeValueCents({ rewardValueCents: 12500 })).toBe(12500);
  });
});

describe('getGiveawayTier', () => {
  it('uses durationType when present', () => {
    expect(getGiveawayTier(giveaway({ id: '1', durationType: 'DAILY' }))).toBe('daily');
    expect(getGiveawayTier(giveaway({ id: '2', durationType: 'WEEKLY' }))).toBe('weekly');
    expect(getGiveawayTier(giveaway({ id: '3', durationType: 'MONTHLY' }))).toBe('monthly');
    expect(getGiveawayTier(giveaway({ id: '4', durationType: 'YEARLY' }))).toBe('special');
  });

  it('deduces the tier from duration when no palier field exists', () => {
    expect(
      getGiveawayTier(
        giveaway({
          id: 'd',
          startDate: '2026-09-16T00:00:00.000Z',
          endDate: '2026-09-16T20:00:00.000Z',
        })
      )
    ).toBe('daily');
    expect(
      getGiveawayTier(
        giveaway({
          id: 'w',
          startDate: '2026-09-16T00:00:00.000Z',
          endDate: '2026-09-22T00:00:00.000Z',
        })
      )
    ).toBe('weekly');
    expect(
      getGiveawayTier(
        giveaway({
          id: 'm',
          startDate: '2026-09-01T00:00:00.000Z',
          endDate: '2026-09-30T00:00:00.000Z',
        })
      )
    ).toBe('monthly');
    expect(
      getGiveawayTier(
        giveaway({
          id: 's',
          startDate: '2026-09-01T00:00:00.000Z',
          endDate: '2026-11-15T00:00:00.000Z',
        })
      )
    ).toBe('special');
  });
});

describe('selectFeaturedGiveaway', () => {
  it('picks the public active giveaway with the highest prize value', () => {
    const featured = selectFeaturedGiveaway([
      giveaway({ id: 'private', isPrivate: true, rewardValueCents: 99999, ticketPrice: 99 }),
      giveaway({ id: 'cheap', rewardValueCents: 1000, ticketPrice: 50 }),
      giveaway({ id: 'jackpot', rewardValueCents: 50000, ticketPrice: 5 }),
      giveaway({ id: 'ended', status: 'ENDED', rewardValueCents: 80000 }),
    ]);
    expect(featured?.id).toBe('jackpot');
  });

  it('falls back to the highest entry cost when no prize value exists', () => {
    const featured = selectFeaturedGiveaway([
      giveaway({ id: 'low', ticketPrice: 5 }),
      giveaway({ id: 'high', ticketPrice: 40 }),
    ]);
    expect(featured?.id).toBe('high');
  });
});

describe('sortGiveaways / filterGiveawaysByTier', () => {
  const list = [
    giveaway({
      id: 'later',
      ticketPrice: 30,
      rewardValueCents: 1000,
      endDate: '2026-09-25T00:00:00.000Z',
      durationType: 'MONTHLY',
    }),
    giveaway({
      id: 'soon',
      ticketPrice: 10,
      rewardValueCents: 8000,
      endDate: '2026-09-17T00:00:00.000Z',
      durationType: 'DAILY',
    }),
    giveaway({
      id: 'mid',
      ticketPrice: 20,
      rewardValueCents: 0,
      endDate: '2026-09-20T00:00:00.000Z',
      durationType: 'WEEKLY',
    }),
  ];

  it('sorts by ending soon, highest value, then lowest cost', () => {
    expect(sortGiveaways(list, 'endingSoon').map((g) => g.id)).toEqual(['soon', 'mid', 'later']);
    expect(sortGiveaways(list, 'highestValue').map((g) => g.id)).toEqual(['soon', 'later', 'mid']);
    expect(sortGiveaways(list, 'lowestCost').map((g) => g.id)).toEqual(['soon', 'mid', 'later']);
  });

  it('filters by deduced or stored tier', () => {
    expect(filterGiveawaysByTier(list, 'all')).toHaveLength(3);
    expect(filterGiveawaysByTier(list, 'daily').map((g) => g.id)).toEqual(['soon']);
    expect(filterGiveawaysByTier(list, 'weekly').map((g) => g.id)).toEqual(['mid']);
  });
});

describe('parsePrizeDisplay / getPrizeHaloColor', () => {
  it('splits weapon, finish and exterior from a market hash name', () => {
    const parsed = parsePrizeDisplay('Redline', 'AK-47 | Redline (Field-Tested)');
    expect(parsed).toMatchObject({
      weapon: 'AK-47',
      finish: 'Redline',
      exterior: 'Field-Tested',
      hasStructuredName: true,
    });
  });

  it('falls back to the prize title when the name is unstructured', () => {
    const parsed = parsePrizeDisplay('50€ cash', null);
    expect(parsed.hasStructuredName).toBe(false);
    expect(parsed.fallbackName).toBe('50€ cash');
  });

  it('uses gold halo for knives/gloves without inventing a rifle rarity', () => {
    expect(getPrizeHaloColor('★ Karambit | Fade (Factory New)')).toBe('#ffd700');
    expect(getPrizeHaloColor('AK-47 | Redline (Field-Tested)')).toBe('#7eb8ff');
  });
});

describe('getTimeRemaining', () => {
  it('splits remaining time into DD:HH:MM:SS parts', () => {
    const now = Date.parse('2026-09-16T00:00:00.000Z');
    const remaining = getTimeRemaining('2026-09-18T05:06:07.000Z', now);
    expect(remaining).toMatchObject({
      days: 2,
      hours: 5,
      minutes: 6,
      seconds: 7,
      expired: false,
    });
  });

  it('marks expired giveaways', () => {
    expect(getTimeRemaining('2026-09-15T00:00:00.000Z', Date.parse('2026-09-16T00:00:00.000Z')).expired).toBe(
      true
    );
  });
});
