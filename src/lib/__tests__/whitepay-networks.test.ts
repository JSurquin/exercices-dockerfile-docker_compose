import {
  WHITEPAY_SUPPORTED_CRYPTOS,
  USER_PAYOUT_SUPPORTED_CRYPTOS,
  DEFAULT_USER_PAYOUT_CRYPTO,
  DEFAULT_USER_PAYOUT_NETWORK,
  isWhitepayCryptoNetworkSupported,
  isUserPayoutTickerAllowed,
  estimateNetworkFeeCentsSync,
  calculateWhitepayFees,
  getDefaultWhitepayNetwork,
  getConservativeNetworkFeeCents,
  getMinWithdrawalCentsForNetworkFee,
  getCryptoFeeRatio,
  isCryptoQuoteCurrent,
  formatWhitepayApiErrorMessage,
  translateWhitepayApiErrorMessage,
  resolveWhitepayClientError,
  WARN_CRYPTO_FEE_RATIO,
  MAX_CRYPTO_FEE_RATIO,
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

  it('defaults to TRC20 or Polygon, never ERC20 when a cheaper network exists', () => {
    expect(getDefaultWhitepayNetwork('USDT')).toBe('TRC20');
    expect(getDefaultWhitepayNetwork('USDC')).toBe('POLYGON');
    expect(getDefaultWhitepayNetwork('ETH')).toBe('ERC20');
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

  it('uses the higher of live and static network fees for the conservative cap', () => {
    expect(getConservativeNetworkFeeCents('USDT', 'ERC20', 80)).toBe(954);
    expect(getConservativeNetworkFeeCents('USDT', 'ERC20', 1200)).toBe(1200);
    expect(getConservativeNetworkFeeCents('USDT', 'TRC20')).toBe(100);
  });

  it('requires a per-network minimum so conservative fees never exceed 10% of gross', () => {
    const erc20Min = getMinWithdrawalCentsForNetworkFee(
      getConservativeNetworkFeeCents('USDT', 'ERC20')
    );
    const fees = calculateWhitepayFees(erc20Min, 954);
    expect(fees.totalFeeCents / erc20Min).toBeLessThanOrEqual(MAX_CRYPTO_FEE_RATIO);
    expect(getCryptoFeeRatio(3000, 954)).toBeGreaterThan(WARN_CRYPTO_FEE_RATIO);
    expect(erc20Min).toBeGreaterThan(3000);
    expect(getMinWithdrawalCentsForNetworkFee(100)).toBeGreaterThanOrEqual(2120);
  });

  it('treats a quote as current only when amount, asset, network and expiry match', () => {
    const quote = {
      amountCents: 3000,
      method: 'CRYPTO',
      targetCurrency: 'USDT',
      network: 'TRC20',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    };
    expect(
      isCryptoQuoteCurrent(quote, { amountCents: 3000, targetCurrency: 'USDT', network: 'TRC20' })
    ).toBe(true);
    expect(
      isCryptoQuoteCurrent(quote, { amountCents: 3000, targetCurrency: 'USDT', network: 'ERC20' })
    ).toBe(false);
    expect(
      isCryptoQuoteCurrent(quote, { amountCents: 4000, targetCurrency: 'USDT', network: 'TRC20' })
    ).toBe(false);
  });

  it('hides USDT from user payout options while keeping it for merchant Whitepay', () => {
    expect(WHITEPAY_SUPPORTED_CRYPTOS.some((c) => c.ticker === 'USDT')).toBe(true);
    const userTickers: string[] = USER_PAYOUT_SUPPORTED_CRYPTOS.map((c) => c.ticker);
    expect(userTickers).not.toContain('USDT');
    expect(userTickers).toContain('USDC');
    expect(isUserPayoutTickerAllowed('USDT')).toBe(false);
    expect(isUserPayoutTickerAllowed('USDC')).toBe(true);
    expect(DEFAULT_USER_PAYOUT_CRYPTO).toBe('USDC');
    expect(DEFAULT_USER_PAYOUT_NETWORK).toBe('POLYGON');
    expect(getDefaultWhitepayNetwork('USDC')).toBe('POLYGON');
    expect(getDefaultWhitepayNetwork('USDT')).toBe('TRC20');
  });

  it('formats Whitepay 422 field errors for the user', () => {
    expect(
      formatWhitepayApiErrorMessage({
        message: 'Whitepay API error: 422',
        responseData: {
          message: 'The given data was invalid',
          errors: { target_currency: ['The selected currency is unavailable: USDT'] },
        },
      })
    ).toBe('The selected currency is unavailable: USDT');
  });

  it('translates Whitepay 422 errors into the user locale', () => {
    const raw = 'The selected currency is unavailable: USDT';
    expect(translateWhitepayApiErrorMessage(raw, 'fr')).toBe(
      "La devise sélectionnée n'est pas disponible : USDT"
    );
    expect(translateWhitepayApiErrorMessage(raw, 'en')).toBe(raw);
    expect(translateWhitepayApiErrorMessage(raw, 'cn')).toBe('所选货币不可用：USDT');
    expect(
      resolveWhitepayClientError(
        {
          error: 'Erreur API Whitepay',
          whitepayErrors: { target_currency: ['The selected currency is unavailable: USDT'] },
        },
        'fr',
        'Erreur'
      )
    ).toBe("La devise sélectionnée n'est pas disponible : USDT");
  });
});
