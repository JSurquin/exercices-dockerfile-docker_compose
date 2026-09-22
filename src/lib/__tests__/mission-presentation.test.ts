import {
  countClaimable,
  formatClaimRewardLabel,
  formatMissionDuration,
  formatMissionProgressLabel,
  formatMissionResetLine,
  getMissionActionHref,
  getMissionActionKind,
  getMissionBlockReason,
  getMissionKind,
  getMissionUiStatus,
  isQuantitativeMission,
  isTodayMissionKey,
  mapMissionClaimError,
  nextMissionResetAt,
  pickDefaultMissionTab,
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

  it('opens the tab with the most claimable missions, else daily', () => {
    expect(
      pickDefaultMissionTab({ DAILY: 0, WEEKLY: 0, MONTHLY: 0, SOCIAL: 0 })
    ).toBe('DAILY');
    expect(
      pickDefaultMissionTab({ DAILY: 1, WEEKLY: 3, MONTHLY: 2, SOCIAL: 0 })
    ).toBe('WEEKLY');
    expect(
      pickDefaultMissionTab({ DAILY: 2, WEEKLY: 2, MONTHLY: 0, SOCIAL: 0 })
    ).toBe('DAILY');
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
    ).toBe('120 € / 500 €');
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
