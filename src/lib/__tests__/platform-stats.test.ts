import { TradeStatus } from '@prisma/client';
import {
  COMPLETED_TRADE_STATUSES,
  EXCHANGED_SKINS_TRADE_WHERE,
} from '@/lib/platform-stats';

describe('EXCHANGED_SKINS_TRADE_WHERE', () => {
  it('counts only completed statuses or trades that were balance-credited', () => {
    expect(COMPLETED_TRADE_STATUSES).toEqual([
      TradeStatus.AVAILABLE,
      TradeStatus.PAYOUT_PENDING,
      TradeStatus.PAID,
    ]);

    expect(EXCHANGED_SKINS_TRADE_WHERE).toEqual({
      OR: [
        { status: { in: COMPLETED_TRADE_STATUSES } },
        { balanceCreditedAt: { not: null } },
      ],
    });
  });
});
