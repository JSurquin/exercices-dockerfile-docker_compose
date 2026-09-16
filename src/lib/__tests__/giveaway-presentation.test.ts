import {
  collectPastWinnerGroups,
  collectPastWinners,
  filterGiveawaysByTier,
  formatChancePercent,
  formatCommunityName,
  formatCompactCountdown,
  formatGiveawayDate,
  formatWinnerCount,
  fragmentsUntilCheapestEntry,
  getDisplayInitials,
  getGiveawayCardAction,
  getGiveawayEntryLimits,
  getGiveawayKicker,
  getGiveawayTier,
  getPrizeHaloColor,
  getPrizeValueCents,
  getTimeRemaining,
  hexContrastRatio,
  nextUtcMidnightMs,
  parsePrizeDisplay,
  resolveAvatarSrc,
  selectFeaturedGiveaway,
  selectHighestValueIndex,
  selectRecurringActiveGiveaways,
  carouselSignedOffset,
  carouselCoverflowTransform,
  carouselCoverflowXPercent,
  getCarouselBreakpoint,
  carouselMaxVisibleOffset,
  insertLocalDailyGiveawayIfMissing,
  LOCAL_DAILY_GIVEAWAY_FIXTURE_ID,
  findPartnerLogo,
  splitCurrencyDisplay,
  sortGiveaways,
  sortGiveawaysByTierThenEnd,
  viewerIsWinner,
  visibleLeaderboardRows,
  GIVEAWAY_TIER_TOKENS_DARK,
  GIVEAWAY_TIER_TOKENS_LIGHT,
  GIVEAWAY_PARTNER_TOKENS,
  type GiveawayPresentationInput,
  type GiveawayTier,
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
    expect(getGiveawayTier(giveaway({ id: '4', durationType: 'YEARLY' }))).toBe('yearly');
    expect(
      getGiveawayTier(
        giveaway({
          id: 'wrong-label',
          durationType: 'WEEKLY',
          startDate: '2025-09-16T00:00:00.000Z',
          endDate: '2026-09-16T00:00:00.000Z',
        })
      )
    ).toBe('yearly');
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
          id: 'y',
          startDate: '2025-09-16T00:00:00.000Z',
          endDate: '2026-09-16T00:00:00.000Z',
        })
      )
    ).toBe('yearly');
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

describe('selectRecurringActiveGiveaways', () => {
  it('keeps public active paliers in daily → weekly → monthly → yearly order', () => {
    const sorted = selectRecurringActiveGiveaways([
      giveaway({
        id: 'year',
        durationType: 'YEARLY',
        startDate: '2025-09-16T00:00:00.000Z',
        endDate: '2026-09-16T00:00:00.000Z',
        rewardValueCents: 80_000,
      }),
      giveaway({
        id: 'month-late',
        startDate: '2026-09-16T00:00:00.000Z',
        endDate: '2026-10-16T00:00:00.000Z',
        rewardValueCents: 5_000,
      }),
      giveaway({
        id: 'week',
        startDate: '2026-09-16T00:00:00.000Z',
        endDate: '2026-09-23T00:00:00.000Z',
        rewardValueCents: 250,
      }),
      giveaway({
        id: 'private',
        isPrivate: true,
        startDate: '2026-09-16T00:00:00.000Z',
        endDate: '2026-10-16T00:00:00.000Z',
      }),
      giveaway({
        id: 'special',
        startDate: '2026-09-01T00:00:00.000Z',
        endDate: '2026-11-15T00:00:00.000Z',
      }),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(['week', 'month-late', 'year']);
    expect(selectHighestValueIndex(sorted)).toBe(2);
  });

  it('inserts a local daily fixture before weekly without breaking coverflow offsets', () => {
    const withoutDaily = [
      giveaway({
        id: 'year',
        durationType: 'YEARLY',
        startDate: '2025-09-16T00:00:00.000Z',
        endDate: '2026-09-16T00:00:00.000Z',
        rewardValueCents: 80_000,
      }),
      giveaway({
        id: 'month',
        startDate: '2026-09-16T00:00:00.000Z',
        endDate: '2026-10-16T00:00:00.000Z',
        rewardValueCents: 5_000,
      }),
      giveaway({
        id: 'week',
        startDate: '2026-09-16T00:00:00.000Z',
        endDate: '2026-09-23T00:00:00.000Z',
        rewardValueCents: 250,
      }),
    ];
    const withDaily = insertLocalDailyGiveawayIfMissing(withoutDaily, Date.parse('2026-09-16T08:00:00.000Z'));
    expect(withDaily.map((item) => item.id)).toEqual([
      LOCAL_DAILY_GIVEAWAY_FIXTURE_ID,
      'week',
      'month',
      'year',
    ]);
    expect(selectHighestValueIndex(withDaily)).toBe(3);
    const yearlyCenter = [0, 1, 2, 3].map((index) => carouselSignedOffset(index, 3, 4));
    expect(yearlyCenter).toEqual([1, -2, -1, 0]);
    expect(carouselCoverflowTransform(2, 'tablet').visible).toBe(false);
    expect(carouselCoverflowTransform(1, 'tablet').visible).toBe(true);
    expect(carouselCoverflowTransform(2, 'desktop').visible).toBe(true);
    expect(insertLocalDailyGiveawayIfMissing(withDaily).map((item) => item.id)[0]).toBe(
      LOCAL_DAILY_GIVEAWAY_FIXTURE_ID
    );
  });

  it('wraps carousel offsets around the center card', () => {
    expect(carouselSignedOffset(2, 2, 3)).toBe(0);
    expect(carouselSignedOffset(0, 2, 3)).toBe(1);
    expect(carouselSignedOffset(1, 2, 3)).toBe(-1);
    expect([carouselSignedOffset(0, 2, 3), carouselSignedOffset(1, 2, 3)].every((offset) => Math.abs(offset) <= 1)).toBe(
      true
    );
  });

  it('exposes unique circular offsets within ±2 for five cards', () => {
    const offsets = [0, 1, 2, 3, 4].map((index) => carouselSignedOffset(index, 2, 5));
    expect(offsets.sort((a, b) => a - b)).toEqual([-2, -1, 0, 1, 2]);
    expect(carouselCoverflowTransform(0)).toMatchObject({ scale: 1, translateY: -24, opacity: 1, visible: true });
    expect(carouselCoverflowTransform(1)).toMatchObject({ scale: 0.82, translateY: 16, opacity: 0.7 });
    expect(carouselCoverflowTransform(-2)).toMatchObject({ scale: 0.68, translateY: 32, opacity: 0.4 });
    expect(carouselCoverflowXPercent(1)).toBe(74);
    expect(carouselCoverflowXPercent(-2)).toBe(-132);
    expect(getCarouselBreakpoint(390)).toBe('mobile');
    expect(getCarouselBreakpoint(1024)).toBe('tablet');
    expect(getCarouselBreakpoint(1440)).toBe('desktop');
    expect(carouselMaxVisibleOffset('mobile')).toBe(1);
    expect(carouselMaxVisibleOffset('tablet')).toBe(1);
    expect(carouselMaxVisibleOffset('desktop')).toBe(2);
    expect(carouselCoverflowXPercent(1, 'mobile')).toBe(98);
    expect(carouselCoverflowTransform(2, 'mobile').visible).toBe(false);
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

describe('formatCompactCountdown', () => {
  const fr = { days: 'j', hours: 'h', minutes: 'min', seconds: 's' };
  const en = { days: 'd', hours: 'h', minutes: 'm', seconds: 's' };

  it('uses locale unit suffixes without padding', () => {
    const remaining = {
      days: 30,
      hours: 2,
      minutes: 0,
      seconds: 0,
      expired: false,
      totalMs: 1,
    };
    expect(formatCompactCountdown(remaining, fr, 'Terminé')).toBe('30j 2h');
    expect(formatCompactCountdown(remaining, en, 'Ended')).toBe('30d 2h');
  });
});

describe('formatGiveawayDate', () => {
  it('formats according to language', () => {
    expect(formatGiveawayDate('2026-09-23T12:00:00.000Z', 'en')).toContain('2026');
    expect(formatGiveawayDate('2026-09-23T12:00:00.000Z', 'fr')).toContain('2026');
  });
});

describe('formatChancePercent / visibleLeaderboardRows / getGiveawayKicker', () => {
  it('formats odds with locale separators', () => {
    expect(formatChancePercent(66.67, 'en')).toBe('66.67%');
    expect(formatChancePercent(66.67, 'fr')).toBe('66,67 %');
  });

  it('keeps at most 5 rows and still includes the viewer', () => {
    const rows = Array.from({ length: 6 }, (_, index) => ({
      username: `p${index + 1}`,
      avatar: null,
      entries: 10 - index,
      isYou: index === 5,
    }));
    const visible = visibleLeaderboardRows(rows, 5);
    expect(visible).toHaveLength(5);
    expect(visible.map((row) => row.username)).toEqual(['p1', 'p2', 'p3', 'p4', 'p6']);
    expect(visible.at(-1)?.isYou).toBe(true);
  });

  it('shows as many rows as the participant counter, up to 5', () => {
    const rows = Array.from({ length: 8 }, (_, index) => ({
      username: `p${index + 1}`,
      avatar: null,
      entries: 8 - index,
    }));
    expect(visibleLeaderboardRows(rows, 5, 3)).toHaveLength(3);
    expect(visibleLeaderboardRows(rows, 5, 10)).toHaveLength(5);
  });

  it('does not duplicate the viewer when they are already in the top 5', () => {
    const visible = visibleLeaderboardRows(
      [
        { username: 'A', avatar: null, entries: 8, isYou: true },
        { username: 'B', avatar: null, entries: 3 },
      ],
      5
    );
    expect(visible).toHaveLength(2);
  });

  it('uses the yearly kicker label', () => {
    expect(
      getGiveawayKicker('yearly', {
        kickerDaily: 'Giveaway journalier',
        kickerWeekly: 'Giveaway hebdomadaire',
        kickerMonthly: 'Giveaway mensuel',
        kickerYearly: 'Giveaway annuel',
        kickerSpecial: 'Giveaway spécial',
      })
    ).toBe('Giveaway annuel');
  });
});

describe('formatWinnerCount / getDisplayInitials / fragmentsUntilCheapestEntry', () => {
  it('picks the singular or plural template', () => {
    expect(formatWinnerCount(1, '{count} gagnant', '{count} gagnants')).toBe('1 gagnant');
    expect(formatWinnerCount(2, '{count} winner', '{count} winners')).toBe('2 winners');
  });

  it('uses Steam-style initials instead of a question mark', () => {
    expect(getDisplayInitials('Kitsu')).toBe('KI');
    expect(getDisplayInitials('John Doe')).toBe('JD');
    expect(getDisplayInitials('')).toBe('');
  });

  it('upgrades protocol-relative and http avatar URLs', () => {
    expect(resolveAvatarSrc('')).toBeUndefined();
    expect(resolveAvatarSrc('https://avatars.steamstatic.com/a.jpg')).toBe(
      'https://avatars.steamstatic.com/a.jpg'
    );
    expect(resolveAvatarSrc('http://avatars.steamstatic.com/a.jpg')).toBe(
      'https://avatars.steamstatic.com/a.jpg'
    );
    expect(resolveAvatarSrc('//avatars.steamstatic.com/a.jpg')).toBe(
      'https://avatars.steamstatic.com/a.jpg'
    );
  });

  it('returns fragments missing for the cheapest active giveaway', () => {
    expect(
      fragmentsUntilCheapestEntry(
        [
          { status: 'ACTIVE', ticketPrice: 50 },
          { status: 'ACTIVE', ticketPrice: 10 },
          { status: 'ENDED', ticketPrice: 1 },
        ],
        4
      )
    ).toBe(6);
    expect(fragmentsUntilCheapestEntry([{ status: 'ACTIVE', ticketPrice: 10 }], 10)).toBeNull();
  });
});

describe('collectPastWinners', () => {
  it('flattens ended giveaway winners newest first', () => {
    const rows = collectPastWinners([
      {
        ...giveaway({
          id: 'old',
          status: 'ENDED',
          endDate: '2026-09-01T00:00:00.000Z',
        }),
        winners: [{ rank: 1, user: { steamUsername: 'Old', steamAvatar: 'a.png' } }],
      },
      {
        ...giveaway({
          id: 'new',
          status: 'ENDED',
          endDate: '2026-09-10T00:00:00.000Z',
          prize: 'AWP | Asiimov',
        }),
        winners: [{ rank: 1, user: { steamUsername: 'New', steamAvatar: null } }],
      },
    ]);
    expect(rows.map((row) => row.username)).toEqual(['New', 'Old']);
    expect(rows[0]?.prize).toBe('AWP | Asiimov');
  });
});

describe('collectPastWinnerGroups / formatCommunityName / card action', () => {
  it('groups several winners of the same giveaway on one row', () => {
    const groups = collectPastWinnerGroups([
      {
        ...giveaway({
          id: 'multi',
          status: 'ENDED',
          endDate: '2026-09-10T00:00:00.000Z',
          prize: 'AWP | Asiimov',
        }),
        winners: [
          { rank: 2, user: { steamUsername: 'B', steamAvatar: null } },
          { rank: 1, user: { steamUsername: 'A', steamAvatar: 'a.png' } },
          { rank: 3, user: { steamUsername: 'C', steamAvatar: null } },
        ],
      },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.winners.map((winner) => winner.username)).toEqual(['A', 'B', 'C']);
  });

  it('capitalizes the community name', () => {
    expect(formatCommunityName('kitsu')).toBe('Kitsu');
    expect(formatCommunityName('  kitsu')).toBe('Kitsu');
  });

  it('matches a partner logo by affiliate code and splits prize amounts', () => {
    const logos = [
      { name: 'Kitsu', logoUrl: 'https://cdn.example/kitsu.png' },
      { name: 'Nova', logoUrl: 'https://cdn.example/nova.png' },
    ];
    expect(findPartnerLogo('kitsu', logos)?.logoUrl).toBe('https://cdn.example/kitsu.png');
    expect(findPartnerLogo('unknown', logos)).toBeNull();
    expect(splitCurrencyDisplay(80000, 'fr', 'EUR')).toEqual({
      integer: '800',
      fraction: ',00',
      symbol: '€',
      symbolFirst: false,
    });
    expect(splitCurrencyDisplay(123456, 'en', 'USD')).toMatchObject({
      fraction: '.56',
      symbol: '$',
      symbolFirst: true,
    });
  });

  it('keeps partner metadata on past winner groups', () => {
    const groups = collectPastWinnerGroups([
      {
        ...giveaway({
          id: 'partner-win',
          status: 'ENDED',
          isPrivate: true,
          prize: 'AWP | Asiimov',
        }),
        requiredAffiliateCode: 'kitsu',
        winners: [{ rank: 1, user: { steamUsername: 'A', steamAvatar: null } }],
      },
    ]);
    expect(groups[0]).toMatchObject({
      isPrivate: true,
      requiredAffiliateCode: 'kitsu',
    });
  });

  it('sorts by palier then end date: daily, weekly, monthly, special, yearly', () => {
    const sorted = sortGiveawaysByTierThenEnd([
      giveaway({
        id: 'year',
        durationType: 'YEARLY',
        startDate: '2025-09-16T00:00:00.000Z',
        endDate: '2026-09-16T00:00:00.000Z',
      }),
      giveaway({
        id: 'daily-late',
        durationType: 'DAILY',
        startDate: '2026-09-16T00:00:00.000Z',
        endDate: '2026-09-17T12:00:00.000Z',
      }),
      giveaway({
        id: 'daily-soon',
        durationType: 'DAILY',
        startDate: '2026-09-16T00:00:00.000Z',
        endDate: '2026-09-16T20:00:00.000Z',
      }),
      giveaway({
        id: 'special',
        startDate: '2026-09-01T00:00:00.000Z',
        endDate: '2026-11-15T00:00:00.000Z',
      }),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(['daily-soon', 'daily-late', 'special', 'year']);
  });

  it('uses reserved / max / unaffordable / participate card actions', () => {
    expect(
      getGiveawayCardAction(
        {
          isPrivate: true,
          canParticipate: false,
          ticketPrice: 10,
          maxTickets: 100,
          soldTickets: 1,
        },
        999
      )
    ).toEqual({ type: 'reserved' });
    expect(
      getGiveawayCardAction(
        {
          ticketPrice: 10,
          maxTickets: 100,
          soldTickets: 1,
          maxEntriesPerUser: 5,
          myEntries: 5,
        },
        999
      )
    ).toEqual({ type: 'maxReached' });
    expect(
      getGiveawayCardAction(
        { ticketPrice: 10, maxTickets: 100, soldTickets: 1, myEntries: 40 },
        999
      )
    ).toEqual({ type: 'participate' });
    expect(
      getGiveawayCardAction({ ticketPrice: 50, maxTickets: 100, soldTickets: 1 }, 10)
    ).toEqual({ type: 'unaffordable', missing: 40 });
  });

  it('does not treat an unaffordable ticket or a zero user cap as max reached', () => {
    expect(
      getGiveawayCardAction(
        { ticketPrice: 500, maxTickets: 10_000, soldTickets: 3, maxEntriesPerUser: 0, myEntries: 0 },
        114
      )
    ).toEqual({ type: 'unaffordable', missing: 386 });
    expect(
      getGiveawayCardAction(
        { ticketPrice: 500, maxTickets: 1_000_000, soldTickets: 0, maxEntriesPerUser: null },
        114
      )
    ).toEqual({ type: 'unaffordable', missing: 386 });
    expect(getGiveawayEntryLimits({ ticketPrice: 500, maxTickets: 10_000, soldTickets: 3 }, 114)).toMatchObject({
      maxAffordable: 0,
      maxSelectable: 0,
      userLimitReached: false,
      maxReached: false,
    });
    expect(
      getGiveawayEntryLimits(
        { ticketPrice: 500, maxTickets: 10_000, soldTickets: 3, maxEntriesPerUser: 0 },
        114
      )
    ).toMatchObject({
      maxAffordable: 0,
      maxSelectable: 0,
      userLimitReached: false,
      maxReached: false,
    });
  });

  it('caps Max to remaining entries only when a positive per-user limit exists', () => {
    expect(
      getGiveawayEntryLimits(
        { ticketPrice: 10, maxTickets: 100, soldTickets: 1, maxEntriesPerUser: 5, myEntries: 3 },
        80
      )
    ).toMatchObject({
      maxAffordable: 8,
      maxSelectable: 2,
      userLimitReached: false,
      maxReached: false,
    });
    expect(
      getGiveawayEntryLimits(
        { ticketPrice: 10, maxTickets: 100, soldTickets: 1, maxEntriesPerUser: 5, myEntries: 5 },
        80
      )
    ).toMatchObject({
      maxSelectable: 0,
      userLimitReached: true,
      maxReached: true,
    });
  });

  it('matches the viewer among public winner names', () => {
    expect(
      viewerIsWinner({ winners: [{ user: { steamUsername: 'Kitsu' } }] }, 'Kitsu')
    ).toBe(true);
    expect(viewerIsWinner({ winners: [{ user: { steamUsername: 'Kitsu' } }] }, 'Other')).toBe(
      false
    );
  });

  it('returns the next UTC midnight', () => {
    expect(nextUtcMidnightMs(Date.parse('2026-09-16T15:00:00.000Z'))).toBe(
      Date.parse('2026-09-17T00:00:00.000Z')
    );
  });
});

describe('giveaway palier tokens contrast', () => {
  const tiers: GiveawayTier[] = ['daily', 'weekly', 'monthly', 'yearly', 'special'];

  it('meets WCAG AA (4.5:1) in dark and light palettes', () => {
    for (const tier of tiers) {
      const dark = GIVEAWAY_TIER_TOKENS_DARK[tier];
      const light = GIVEAWAY_TIER_TOKENS_LIGHT[tier];
      expect(hexContrastRatio(dark.fg, dark.bg)).toBeGreaterThanOrEqual(4.5);
      expect(hexContrastRatio(light.fg, light.bg)).toBeGreaterThanOrEqual(4.5);
    }
    expect(hexContrastRatio(GIVEAWAY_PARTNER_TOKENS.fg, GIVEAWAY_PARTNER_TOKENS.bg)).toBeGreaterThanOrEqual(
      4.5
    );
  });
});
