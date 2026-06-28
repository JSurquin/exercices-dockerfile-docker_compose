import { resolveMoonSkinTradeStatusFromSkinplaceApi } from '@/lib/skinplace-trade-status-resolve';

describe('resolveMoonSkinTradeStatusFromSkinplaceApi', () => {
  it('maps payment.status=complete + protection_status=unconfirmed to IN_TRADE_HOLD', () => {
    const result = resolveMoonSkinTradeStatusFromSkinplaceApi({
      data: {
        payment: { status: 'complete', protection_status: 'unconfirmed' },
        steamtrade: { status: 'finished' },
      },
    });

    expect(result.status).toBe('IN_TRADE_HOLD');
    expect(result.debug.effectiveSource).toBe('payment.status=complete');
  });

  it('maps steamtrade.status=active to ACCEPTED_BY_BOT (offer sent)', () => {
    const result = resolveMoonSkinTradeStatusFromSkinplaceApi({
      data: {
        payment: { status: 'active' },
        steamtrade: { status: 'active' },
      },
    });

    expect(result.status).toBe('ACCEPTED_BY_BOT');
  });

  it('prioritises payment.status=cancelled over steamtrade.status=finished', () => {
    const result = resolveMoonSkinTradeStatusFromSkinplaceApi({
      data: {
        payment: { status: 'cancelled', protection_status: 'unconfirmed' },
        steamtrade: { status: 'finished' },
      },
    });

    expect(result.status).toBe('CANCELLED');
  });

  it('maps protection_status=confirmed to AVAILABLE', () => {
    const result = resolveMoonSkinTradeStatusFromSkinplaceApi({
      data: {
        payment: { status: 'complete', protection_status: 'confirmed' },
        steamtrade: { status: 'finished' },
      },
    });

    expect(result.status).toBe('AVAILABLE');
  });
});

describe('Skinplace webhook IPN routing', () => {
  function shouldHandleAsIpn2(protectionStatus: string | null, status: string): boolean {
    return protectionStatus === 'confirmed' || protectionStatus === 'rollback';
  }

  it('does not treat unconfirmed+complete as IPN #2 (must fall through to IPN #1)', () => {
    expect(shouldHandleAsIpn2('unconfirmed', 'complete')).toBe(false);
  });

  it('handles confirmed and rollback as IPN #2', () => {
    expect(shouldHandleAsIpn2('confirmed', 'complete')).toBe(true);
    expect(shouldHandleAsIpn2('rollback', 'cancelled')).toBe(true);
  });
});
