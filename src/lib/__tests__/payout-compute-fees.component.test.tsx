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
    expect(first.networkCents).toBe(100);
    expect(first.netCents).toBe(amountCents - first.totalCents);
  });

  it('recalculates network fee and net when the blockchain network changes', () => {
    const polygon = computeFees('crypto', amountCents, { targetCurrency: 'USDC', network: 'POLYGON' });
    const eth = computeFees('crypto', amountCents, { targetCurrency: 'ETH', network: 'ERC20' });
    expect(polygon.networkCents).toBe(100);
    expect(eth.networkCents).toBeGreaterThan(polygon.networkCents);
    expect(polygon.netCents).toBeGreaterThan(eth.netCents);
    expect(polygon.netCents - eth.netCents).toBe(eth.networkCents - polygon.networkCents);
  });

  it('recalculates when the gross amount changes', () => {
    const small = computeFees('crypto', 3000, { targetCurrency: 'USDT', network: 'TRC20' });
    const large = computeFees('crypto', 10_000, { targetCurrency: 'USDT', network: 'TRC20' });
    expect(large.processingCents).toBeGreaterThan(small.processingCents);
    expect(large.networkCents).toBe(small.networkCents);
  });
});
