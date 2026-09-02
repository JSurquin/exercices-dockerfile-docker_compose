import {
  extractSkinplaceInventoryItems,
  isSkinplaceItemSellable,
  isRetryableSkinplaceInventoryError,
  mapSkinplaceInventoryFailure,
  skinplaceErrorFields,
} from '@/lib/skinplace-instant-inventory';

describe('isSkinplaceItemSellable', () => {
  const base = {
    market_hash_name: 'AK-47 | Redline (FT)',
    assetid: '1',
    untouchable: false,
    is_stattrak: 0,
    is_souvenir: 0,
    rarity: 'Classified',
    exterior: 'Field-Tested',
    price: 10,
    icon_url: 'x',
  };

  it('allows items Skinplace can buy', () => {
    expect(isSkinplaceItemSellable(base)).toBe(true);
  });

  it('rejects locked or overstock items', () => {
    expect(isSkinplaceItemSellable({ ...base, untouchable: true })).toBe(false);
    expect(isSkinplaceItemSellable({ ...base, skip_reason: 'overstock' })).toBe(false);
    expect(isSkinplaceItemSellable({ ...base, assetid: '' })).toBe(false);
  });
});

describe('extractSkinplaceInventoryItems', () => {
  const item = {
    market_hash_name: 'AK-47 | Redline (FT)',
    assetid: '1',
    untouchable: false,
    is_stattrak: 0,
    is_souvenir: 0,
    rarity: 'Classified',
    exterior: 'Field-Tested',
    price: 10,
    icon_url: 'x',
  };

  it('reads inventory, data.inventory, data.items and a root array', () => {
    expect(extractSkinplaceInventoryItems({ inventory: [item] })).toEqual([item]);
    expect(extractSkinplaceInventoryItems({ data: { inventory: [item] } })).toEqual([item]);
    expect(extractSkinplaceInventoryItems({ success: true, data: { items: [item] } })).toEqual([item]);
    expect(extractSkinplaceInventoryItems([item])).toEqual([item]);
  });

  it('rejects error envelopes', () => {
    expect(extractSkinplaceInventoryItems({ success: false, data: { items: [item] } })).toBeNull();
    expect(extractSkinplaceInventoryItems({ status: 'error', error_message: 'need_auth' })).toBeNull();
    expect(extractSkinplaceInventoryItems({ hello: true })).toBeNull();
  });
});

describe('skinplaceErrorFields and mapSkinplaceInventoryFailure', () => {
  it('retries parse_inventory and steam_down, not empty_inventory', () => {
    expect(isRetryableSkinplaceInventoryError('empty_inventory')).toBe(false);
    expect(isRetryableSkinplaceInventoryError('parse_inventory')).toBe(true);
    expect(isRetryableSkinplaceInventoryError('steam_down')).toBe(true);
    expect(isRetryableSkinplaceInventoryError('need_auth')).toBe(false);
    expect(isRetryableSkinplaceInventoryError('private_inventory')).toBe(false);
  });

  it('extracts status and error_message tokens', () => {
    expect(skinplaceErrorFields({ status: 'error', error_message: 'need_auth' })).toEqual({
      status: 'error',
      error_message: 'need_auth',
    });
  });

  it('maps private inventory to a 400 validation error', () => {
    const mapped = mapSkinplaceInventoryFailure({
      ok: false,
      code: 'API_ERROR',
      error: 'Unable to fetch inventory from the trade provider',
      provider: { status: 'error', error_message: 'private_inventory' },
    });
    expect(mapped).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Steam inventory is private or inaccessible',
      httpStatus: 400,
      extra: { provider_status: 'error', provider_error: 'private_inventory' },
    });
  });

  it('maps unknown Skinplace errors to 503 so Cloudflare does not swallow the JSON', () => {
    const mapped = mapSkinplaceInventoryFailure({
      ok: false,
      code: 'API_ERROR',
      error: 'Unable to fetch inventory from the trade provider',
      provider: { status: 'error', error_message: 'need_auth' },
    });
    expect(mapped.httpStatus).toBe(503);
    expect(mapped.code).toBe('API_ERROR');
    expect(mapped.extra).toEqual({ provider_status: 'error', provider_error: 'need_auth' });
  });
});
