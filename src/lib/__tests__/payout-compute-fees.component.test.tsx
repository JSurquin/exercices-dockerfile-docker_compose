/**
 * @jest-environment jsdom
 */
import { computeFees } from '@/components/payout/FeePreview';

describe('computeFees — shared payout preview / confirm calculation', () => {
  const amountCents = 3000;

  it('returns the same net and network fee for the same crypto + network', () => {
    const first = computeFees('crypto', amountCents, { targetCurrency: 'USDT', network: 'ERC20' });
    const second = computeFees('crypto', amountCents, { targetCurrency: 'USDT', network: 'ERC20' });
    expect(second).toEqual(first);
    expect(first.networkCents).toBe(954);
    expect(first.netCents).toBe(amountCents - first.totalCents);
  });

  it('recalculates network fee and net when the blockchain network changes', () => {
    const erc20 = computeFees('crypto', amountCents, { targetCurrency: 'USDT', network: 'ERC20' });
    const trc20 = computeFees('crypto', amountCents, { targetCurrency: 'USDT', network: 'TRC20' });
    expect(erc20.networkCents).toBe(954);
    expect(trc20.networkCents).toBe(100);
    expect(trc20.netCents).toBeGreaterThan(erc20.netCents);
    expect(trc20.netCents - erc20.netCents).toBe(erc20.networkCents - trc20.networkCents);
  });

  it('recalculates when the gross amount changes', () => {
    const small = computeFees('crypto', 3000, { targetCurrency: 'USDT', network: 'TRC20' });
    const large = computeFees('crypto', 10_000, { targetCurrency: 'USDT', network: 'TRC20' });
    expect(large.processingCents).toBeGreaterThan(small.processingCents);
    expect(large.networkCents).toBe(small.networkCents);
  });
});
