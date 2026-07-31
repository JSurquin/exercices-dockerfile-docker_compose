import {
  WHITEPAY_SUPPORTED_CRYPTOS,
  isWhitepayCryptoNetworkSupported,
  estimateNetworkFeeCentsSync,
  calculateWhitepayFees,
} from '@/lib/whitepay';

describe('Whitepay crypto/network config', () => {
  it('supports USDC on POLYGON', () => {
    expect(isWhitepayCryptoNetworkSupported('USDC', 'POLYGON')).toBe(true);
  });

  it('rejects unknown network for USDC', () => {
    expect(isWhitepayCryptoNetworkSupported('USDC', 'TRC20')).toBe(false);
  });

  it('lists cheaper USDT networks before ERC20', () => {
    const usdt = WHITEPAY_SUPPORTED_CRYPTOS.find((c) => c.ticker === 'USDT');
    expect(usdt?.networks[0]).toBe('TRC20');
    expect(usdt?.networks.at(-1)).toBe('ERC20');
  });

  it('estimates ERC20 stablecoin network fees higher than cheap L2 networks', () => {
    expect(estimateNetworkFeeCentsSync('USDC', 'POLYGON')).toBe(100);
    expect(estimateNetworkFeeCentsSync('USDC', 'ERC20')).toBe(954);
    expect(estimateNetworkFeeCentsSync('USDT', 'TRC20')).toBe(100);
    expect(estimateNetworkFeeCentsSync('USDT', 'ERC20')).toBe(954);
  });

  it('includes network fees in total Whitepay fee calculation', () => {
    const fees = calculateWhitepayFees(10_000, 100);
    expect(fees.processingFeeCents).toBe(110);
    expect(fees.networkFeeCents).toBe(100);
    expect(fees.totalFeeCents).toBe(210);
  });
});
