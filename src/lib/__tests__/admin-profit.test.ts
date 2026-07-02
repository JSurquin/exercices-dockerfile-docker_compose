import {
  buildAdminProfitTradeRow,
  extractSkinplacePriceCents,
  profitAttributionDate,
  PROFIT_COUNTED_TRADE_STATUSES,
} from '@/lib/admin-profit';
import { TradeStatus } from '@prisma/client';

describe('admin-profit', () => {
  it('counts profit from IN_TRADE_HOLD onward', () => {
    expect(PROFIT_COUNTED_TRADE_STATUSES).toContain(TradeStatus.IN_TRADE_HOLD);
    expect(PROFIT_COUNTED_TRADE_STATUSES).not.toContain(TradeStatus.CREATED);
  });

  it('uses pendingCreditedAt as profit attribution date (hold / IPN #1)', () => {
    const holdDate = new Date('2026-07-01T14:00:00.000Z');
    const creditedDate = new Date('2026-07-08T14:00:00.000Z');

    expect(
      profitAttributionDate({
        pendingCreditedAt: holdDate,
        tradeAcceptedAt: new Date('2026-07-01T13:00:00.000Z'),
        instantCreditedAt: null,
        balanceCreditedAt: creditedDate,
        createdAt: new Date('2026-07-01T12:00:00.000Z'),
      }),
    ).toEqual(holdDate);
  });

  it('computes profit from Skinplace market price minus gross and VIP/promo bonuses', () => {
    const trade = {
      id: 'trade-1',
      ticketId: 'ORDER-123',
      grossCents: 9_500,
      affiliatePromoBonusCents: 20,
      vipBonusCents: 100,
      createdAt: new Date('2026-07-01T12:00:00.000Z'),
      pendingCreditedAt: new Date('2026-07-01T14:00:00.000Z'),
      tradeAcceptedAt: null,
      instantCreditedAt: null,
      balanceCreditedAt: null,
      user: { steamUsername: 'player', name: null },
    };

    const row = buildAdminProfitTradeRow(
      trade,
      new Map([['ORDER-123', 10_000]]),
    );

    expect(row).toMatchObject({
      paidToUserCentimes: 9_500,
      skinplaceCentimes: 10_000,
      bonusCentimes: 120,
      profitCentimes: 380,
      marginPercent: 3.8,
    });
  });

  it('prefers price_market over payment.amount for Skinplace payout', () => {
    expect(
      extractSkinplacePriceCents({
        payment: { order_id: 'ORDER-1', amount: 95, multiplier_amount: 5 },
        steamtrade: { price: 95, price_market: 100 },
      }),
    ).toBe(10_000);
  });

  it('falls back to payment.amount + multiplier_amount when price_market is missing', () => {
    expect(
      extractSkinplacePriceCents({
        payment: { order_id: 'ORDER-1', amount: 99, multiplier_amount: 1 },
        steamtrade: { price: 99 },
      }),
    ).toBe(10_000);
  });
});
