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

  it('includes extended USDT networks from Whitepay API', () => {
    const usdt = WHITEPAY_SUPPORTED_CRYPTOS.find((c) => c.ticker === 'USDT');
    expect(usdt?.networks).toEqual(
      expect.arrayContaining(['POLYGON', 'ARBITRUM', 'NEAR', 'CCHAIN'])
    );
  });

  it('estimates network fees per network', () => {
    expect(estimateNetworkFeeCentsSync('USDC', 'POLYGON')).toBeGreaterThan(0);
    expect(estimateNetworkFeeCentsSync('USDC', 'ERC20')).toBeGreaterThan(
      estimateNetworkFeeCentsSync('USDC', 'POLYGON')
    );
  });

  it('includes network fees in total Whitepay fee calculation', () => {
    const fees = calculateWhitepayFees(10_000, 100);
    expect(fees.processingFeeCents).toBe(110);
    expect(fees.networkFeeCents).toBe(100);
    expect(fees.totalFeeCents).toBe(210);
  });
});
