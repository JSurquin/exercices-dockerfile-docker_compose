export type PartnerQuotedTradeItem = { asset_id: string; price_cents?: number };

export function partnerQuotedPriceMismatch(
  items: PartnerQuotedTradeItem[],
  verifiedPrices: Map<string, { price_centimes: number }>,
  liveGrossCents: number,
  expectedGrossCents?: number
): { error: string; extra: Record<string, unknown> } | null {
  for (const item of items) {
    if (item.price_cents === undefined) continue;
    const live = verifiedPrices.get(item.asset_id);
    if (!live) continue;
    if (live.price_centimes !== item.price_cents) {
      return {
        error: 'Quoted item price no longer matches the live price',
        extra: {
          asset_id: item.asset_id,
          expected_price_cents: item.price_cents,
          actual_price_cents: live.price_centimes,
        },
      };
    }
  }

  if (expectedGrossCents !== undefined && expectedGrossCents !== liveGrossCents) {
    return {
      error: 'Quoted total price no longer matches the live price',
      extra: {
        expected_price_cents: expectedGrossCents,
        actual_price_cents: liveGrossCents,
      },
    };
  }

  return null;
}
