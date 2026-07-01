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

  it('computes profit from Skinplace price minus gross (without promo bonuses)', () => {
    const trade = {
      id: 'trade-1',
      ticketId: 'ORDER-123',
      grossCents: 10_000,
      createdAt: new Date('2026-07-01T12:00:00.000Z'),
      pendingCreditedAt: new Date('2026-07-01T14:00:00.000Z'),
      tradeAcceptedAt: null,
      instantCreditedAt: null,
      balanceCreditedAt: null,
      user: { steamUsername: 'player', name: null },
    };

    const row = buildAdminProfitTradeRow(
      trade,
      new Map([['ORDER-123', 10_700]]),
    );

    expect(row).toMatchObject({
      paidToUserCentimes: 10_000,
      skinplaceCentimes: 10_700,
      profitCentimes: 700,
      marginPercent: 6.5,
    });
  });

  it('extracts Skinplace price from payment.amount when present', () => {
    expect(
      extractSkinplacePriceCents({
        payment: { order_id: 'ORDER-1', amount: 42.5 },
        steamtrade: { price: 40 },
      }),
    ).toBe(4250);
  });
});
