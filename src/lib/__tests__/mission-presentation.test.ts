import {
  countClaimable,
  sumClaimableRewards,
  formatClaimRewardLabel,
  formatMissionDuration,
  formatMissionEur,
  formatMissionProgressLabel,
  formatMissionResetLine,
  formatMissionTitle,
  getMissionActionHref,
  getMissionActionKind,
  getMissionBlockReason,
  getMissionKind,
  getMissionUiStatus,
  isQuantitativeMission,
  isTodayMissionKey,
  areAllMissionsClaimed,
  formatClaimableBadge,
  formatSectionAllDone,
  groupMissionsForPage,
  hasUsefulMissionDescription,
  hasVisitedSocialMission,
  markSocialMissionVisited,
  MISSION_SECTIONS,
  partitionMissionsByClaimed,
  mapMissionClaimError,
  nextMissionResetAt,
  sortMissionsByStatus,
  TODAY_MISSION_KEYS,
  type MissionRow,
} from '@/lib/mission-presentation';

const labels = { days: 'j', hours: 'h', minutes: 'min', seconds: 's' };

function mission(partial: Partial<MissionRow> & Pick<MissionRow, 'key'>): MissionRow {
  return {
    category: 'DAILY',
    rewardFragments: 10,
    periodKey: 'day:2026-09-22',
    completed: false,
    eligible: false,
    ...partial,
  };
}

describe('mission presentation', () => {
  it('keeps surprise, daily claim and daily visit as three distinct today keys', () => {
    expect(TODAY_MISSION_KEYS).toEqual(['BONUS_DAILY_SURPRISE', 'DAILY_CLAIM', 'DAILY_VISIT']);
    expect(isTodayMissionKey('BONUS_DAILY_SURPRISE')).toBe(true);
    expect(isTodayMissionKey('DAILY_CLAIM')).toBe(true);
    expect(isTodayMissionKey('DAILY_VISIT')).toBe(true);
    expect(isTodayMissionKey('DAILY_SELL_SKIN')).toBe(false);
  });

  it('groups today tiles separately from daily action missions without duplicates', () => {
    const grouped = groupMissionsForPage([
      mission({ key: 'WELCOME_BONUS', category: 'BONUS' }),
      mission({ key: 'BONUS_DAILY_SURPRISE', category: 'BONUS' }),
      mission({ key: 'DAILY_CLAIM', category: 'DAILY' }),
      mission({ key: 'DAILY_VISIT', category: 'DAILY' }),
      mission({ key: 'DAILY_SELL_SKIN', category: 'DAILY' }),
      mission({ key: 'WEEKLY_SELL_500', category: 'WEEKLY' }),
      mission({ key: 'MONTHLY_SELL_5000', category: 'MONTHLY' }),
      mission({ key: 'SOCIAL_DISCORD', category: 'SOCIAL' }),
    ]);
    expect(grouped.todayTiles.map((row) => row.key)).toEqual([
      'BONUS_DAILY_SURPRISE',
      'DAILY_CLAIM',
      'DAILY_VISIT',
    ]);
    expect(grouped.dailyActions.map((row) => row.key)).toEqual(['DAILY_SELL_SKIN']);
    expect(grouped.weekly.map((row) => row.key)).toEqual(['WEEKLY_SELL_500']);
    expect(grouped.monthly.map((row) => row.key)).toEqual(['MONTHLY_SELL_5000']);
    expect(grouped.social.map((row) => row.key)).toEqual(['SOCIAL_DISCORD']);
    expect(grouped.welcome?.key).toBe('WELCOME_BONUS');
    expect(MISSION_SECTIONS).toEqual(['TODAY', 'WEEKLY', 'MONTHLY', 'SOCIAL']);
  });

  it('hides repeating volume copy and keeps non-obvious conditions for the info tooltip', () => {
    expect(hasUsefulMissionDescription({ key: 'SOCIAL_DISCORD', category: 'SOCIAL' })).toBe(false);
    expect(hasUsefulMissionDescription({ key: 'WEEKLY_SELL_500', category: 'WEEKLY' })).toBe(false);
    expect(hasUsefulMissionDescription({ key: 'DAILY_SELL_SKIN', category: 'DAILY' })).toBe(true);
    expect(hasUsefulMissionDescription({ key: 'WEEKLY_GIVEAWAY_3', category: 'WEEKLY' })).toBe(true);
  });

  it('splits claimed missions to the end and formats section badges', () => {
    const { active, claimed } = partitionMissionsByClaimed([
      mission({ key: 'C', eligible: false, completed: true }),
      mission({ key: 'B', eligible: false, completed: false }),
      mission({ key: 'A', eligible: true, completed: false }),
    ]);
    expect(active.map((row) => row.key)).toEqual(['A', 'B']);
    expect(claimed.map((row) => row.key)).toEqual(['C']);
    expect(areAllMissionsClaimed(claimed)).toBe(true);
    expect(areAllMissionsClaimed(active)).toBe(false);
    expect(formatClaimableBadge('{n} à réclamer', 0)).toBeNull();
    expect(formatClaimableBadge('{n} à réclamer', 2)).toBe('2 à réclamer');
    expect(formatSectionAllDone('Tout est fait ✓ · {reset}', 'Réinitialisation dans 5h')).toBe(
      'Tout est fait ✓ · Réinitialisation dans 5h'
    );
  });

  it('persists social visits in the provided storage without a backend call', () => {
    const memory = new Map<string, string>();
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
    };
    expect(hasVisitedSocialMission('SOCIAL_DISCORD', storage)).toBe(false);
    markSocialMissionVisited('SOCIAL_DISCORD', storage);
    expect(hasVisitedSocialMission('SOCIAL_DISCORD', storage)).toBe(true);
  });

  it('counts only eligible unclaimed missions', () => {
    expect(
      countClaimable([
        mission({ key: 'A', eligible: true, completed: false }),
        mission({ key: 'B', eligible: true, completed: true }),
        mission({ key: 'C', eligible: false, completed: false }),
      ])
    ).toBe(1);
  });

  it('sums currently claimable rewards without a new request', () => {
    expect(
      sumClaimableRewards([
        mission({ key: 'A', eligible: true, completed: false, rewardFragments: 10 }),
        mission({ key: 'B', eligible: true, completed: true, rewardFragments: 1000 }),
        mission({ key: 'C', eligible: false, completed: false, rewardFragments: 50 }),
        mission({ key: 'D', eligible: true, completed: false, rewardFragments: 25 }),
      ])
    ).toBe(35);
  });

  it('computes UTC day / week / month resets without exposing UTC in the label', () => {
    const tuesday = new Date('2026-09-22T15:40:00.000Z');
    expect(nextMissionResetAt('day', tuesday)?.toISOString()).toBe('2026-09-23T00:00:00.000Z');
    expect(nextMissionResetAt('week', tuesday)?.toISOString()).toBe('2026-09-28T00:00:00.000Z');
    expect(nextMissionResetAt('month', tuesday)?.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(nextMissionResetAt('once', tuesday)).toBeNull();

    const now = Date.parse('2026-09-22T18:48:00.000Z');
    const duration = formatMissionDuration(new Date('2026-09-23T00:00:00.000Z'), labels, now);
    expect(duration).toBe('5h 12min');
    expect(
      formatMissionResetLine(
        'Réinitialisation dans {duration}',
        new Date('2026-09-23T00:00:00.000Z'),
        labels,
        'none',
        now
      )
    ).toBe('Réinitialisation dans 5h 12min');
    expect(duration).not.toMatch(/UTC/i);
  });

  it('maps action kinds and never locks an incomplete mission', () => {
    expect(getMissionKind('WEEKLY_SELL_500')).toBe('sell');
    expect(getMissionKind('WEEKLY_GIVEAWAY_3')).toBe('giveaway');
    expect(getMissionKind('SOCIAL_DISCORD')).toBe('social');
    expect(getMissionKind('DAILY_CLAIM')).toBe('daily');
    expect(getMissionActionKind('DAILY_SELL_SKIN')).toBe('sell');
    expect(getMissionActionHref('DAILY_SELL_SKIN')).toBe('/sell');
    expect(getMissionActionHref('WEEKLY_GIVEAWAY_3')).toBe('/giveaways');
    expect(getMissionActionHref('SOCIAL_NEWSLETTER')).toBe('/#newsletter');
    expect(getMissionActionHref('SOCIAL_DISCORD', 'https://discord.gg/moonskin')).toBe(
      'https://discord.gg/moonskin'
    );

    const inProgress = mission({ key: 'WEEKLY_SELL_500', eligible: false, completed: false });
    expect(getMissionUiStatus(inProgress)).toBe('in_progress');
    expect(getMissionBlockReason(inProgress)).toBeNull();
    expect(getMissionBlockReason(mission({ key: 'DAILY_CLAIM', eligible: true }))).toBeNull();
  });

  it('sorts claimable first, then in progress, then claimed', () => {
    const rows = [
      mission({ key: 'C', eligible: false, completed: true }),
      mission({ key: 'B', eligible: false, completed: false }),
      mission({ key: 'A', eligible: true, completed: false }),
    ];
    expect(sortMissionsByStatus(rows).map((row) => row.key)).toEqual(['A', 'B', 'C']);
  });

  it('shows progress only for quantitative missions and formats euro totals', () => {
    expect(
      formatMissionProgressLabel({
        progressCurrent: 12_000,
        progressTarget: 50_000,
        thresholdCents: 50_000,
      })
    ).toBe(`${formatMissionEur(12_000, 'fr')} / ${formatMissionEur(50_000, 'fr')}`);
    expect(
      formatMissionProgressLabel(
        {
          progressCurrent: 0,
          progressTarget: 1_000_000,
          thresholdCents: 1_000_000,
        },
        'en'
      )
    ).toBe(`${formatMissionEur(0, 'en')} / ${formatMissionEur(1_000_000, 'en')}`);
    expect(formatMissionTitle('Vendre {amount}', { thresholdCents: 1_000_000 }, 'fr')).toBe(
      `Vendre ${formatMissionEur(1_000_000, 'fr')}`
    );
    expect(formatMissionTitle('Sell {amount}', { thresholdCents: 1_000_000 }, 'en')).toBe(
      `Sell ${formatMissionEur(1_000_000, 'en')}`
    );
    expect(formatMissionEur(1_000_000, 'en')).toBe('€10,000');
    expect(
      isQuantitativeMission({ progressTarget: 50_000, completed: false })
    ).toBe(true);
    expect(
      isQuantitativeMission({ progressTarget: 50_000, completed: true })
    ).toBe(false);
    expect(formatClaimRewardLabel('Réclamer +{n}', 50)).toBe('Réclamer +50');
  });

  it('maps server claim errors to i18n without changing server logic', () => {
    const copy = {
      errorAlreadyClaimed: 'Déjà réclamée',
      errorRequirements: 'Pas encore',
      errorUnknown: 'Inconnue',
      errorAuth: 'Connecte-toi',
      errorServer: 'Réessaie',
      genericError: 'Erreur',
    };
    expect(mapMissionClaimError('Already claimed for this period', copy)).toBe('Déjà réclamée');
    expect(mapMissionClaimError('Requirements not met', copy)).toBe('Pas encore');
    expect(mapMissionClaimError('Unknown mission', copy)).toBe('Inconnue');
    expect(mapMissionClaimError('Non authentifié', copy)).toBe('Connecte-toi');
    expect(mapMissionClaimError('Erreur serveur', copy)).toBe('Réessaie');
    expect(mapMissionClaimError('Erreur', copy)).toBe('Erreur');
  });
});
