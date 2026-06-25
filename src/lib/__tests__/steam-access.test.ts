import { getAllowedSteamIds, isSteamIdAllowedForUser } from '@/lib/steam-access';

const TRADE_LINK =
  'https://steamcommunity.com/tradeoffer/new/?partner=103154388&token=abc123';
const TRADE_LINK_STEAM_ID = '76561198063420116';
const LINKED_STEAM_ID = '76561198123456789';

describe('steam-access', () => {
  it('autorise le Steam ID extrait du trade link enregistré (compte Discord)', () => {
    const allowed = getAllowedSteamIds(null, {
      steamId: null,
      tradeLink: TRADE_LINK,
    });

    expect(allowed).toContain(TRADE_LINK_STEAM_ID);
    expect(
      isSteamIdAllowedForUser(TRADE_LINK_STEAM_ID, null, {
        steamId: null,
        tradeLink: TRADE_LINK,
      }),
    ).toBe(true);
  });

  it('autorise le Steam ID lié en base (prioritaire sur la session)', () => {
    expect(
      isSteamIdAllowedForUser(LINKED_STEAM_ID, null, {
        steamId: LINKED_STEAM_ID,
        tradeLink: null,
      }),
    ).toBe(true);
  });

  it('refuse un Steam ID non lié au compte', () => {
    expect(
      isSteamIdAllowedForUser('76561199040420116', null, {
        steamId: null,
        tradeLink: null,
      }),
    ).toBe(false);
  });
});
