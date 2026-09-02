import { isSkinplaceItemSellable } from '@/lib/skinplace-instant-inventory';

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
