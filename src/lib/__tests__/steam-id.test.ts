import { normalizeSteamTradeLink, parseSteamId64FromUserInput } from '@/lib/steam-id';

describe('normalizeSteamTradeLink', () => {
  it('normalise un trade link standard', () => {
    expect(
      normalizeSteamTradeLink(
        'https://steamcommunity.com/tradeoffer/new/?partner=103154388&token=abc123',
      ),
    ).toBe('https://steamcommunity.com/tradeoffer/new/?partner=103154388&token=abc123');
  });

  it('supprime les paramètres URL superflus', () => {
    expect(
      normalizeSteamTradeLink(
        'https://steamcommunity.com/tradeoffer/new/?partner=103154388&token=abc123&utm_source=steam',
      ),
    ).toBe('https://steamcommunity.com/tradeoffer/new/?partner=103154388&token=abc123');
  });

  it('retourne null pour un SteamID64 seul', () => {
    expect(normalizeSteamTradeLink('76561198063420116')).toBeNull();
  });
});

describe('parseSteamId64FromUserInput + normalizeSteamTradeLink', () => {
  it('extrait le même Steam ID depuis un lien normalisé ou non', () => {
    const raw =
      'https://steamcommunity.com/tradeoffer/new/?partner=103154388&token=abc123&foo=bar';
    const normalized = normalizeSteamTradeLink(raw);
    expect(normalized).not.toBeNull();
    expect(parseSteamId64FromUserInput(raw)).toBe(parseSteamId64FromUserInput(normalized!));
  });
});
