import {
  extractSteamTradeOfferId,
  normalizeSteamTradeOfferId,
} from '@/lib/steam-trade-offer-id';

describe('normalizeSteamTradeOfferId', () => {
  it('keeps numeric string IDs', () => {
    expect(normalizeSteamTradeOfferId('7654321098')).toBe('7654321098');
    expect(normalizeSteamTradeOfferId(7654321098)).toBe('7654321098');
  });

  it('rejects empty, zero and non-numeric values', () => {
    expect(normalizeSteamTradeOfferId(null)).toBeNull();
    expect(normalizeSteamTradeOfferId(undefined)).toBeNull();
    expect(normalizeSteamTradeOfferId('')).toBeNull();
    expect(normalizeSteamTradeOfferId('0')).toBeNull();
    expect(normalizeSteamTradeOfferId('null')).toBeNull();
    expect(normalizeSteamTradeOfferId('abc')).toBeNull();
  });
});

describe('extractSteamTradeOfferId', () => {
  it('reads steamtrade.tradeofferid from a Skinplace create response', () => {
    expect(
      extractSteamTradeOfferId({
        status: 'success',
        steamtrade: { tradeofferid: '4123456789', status: 'active' },
      })
    ).toBe('4123456789');
  });

  it('reads trade_offer_id on steamtrade and nested data envelopes', () => {
    expect(
      extractSteamTradeOfferId({
        data: { steamtrade: { trade_offer_id: '555' } },
      })
    ).toBe('555');
  });

  it('reads the first offer in a steamtrade array', () => {
    expect(
      extractSteamTradeOfferId({
        steamtrade: [{ tradeofferid: '111' }, { tradeofferid: '222' }],
      })
    ).toBe('111');
  });

  it('reads IPN query-style values', () => {
    expect(extractSteamTradeOfferId('7654321098')).toBe('7654321098');
    expect(extractSteamTradeOfferId({ tradeoffer_id: '99' })).toBe('99');
  });

  it('returns null when Steam has not created the offer yet', () => {
    expect(extractSteamTradeOfferId({ steamtrade: { tradeofferid: null } })).toBeNull();
    expect(extractSteamTradeOfferId({ status: 'success' })).toBeNull();
  });
});
