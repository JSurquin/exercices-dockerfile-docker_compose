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
  isCryptoQuoteCurrent,
  formatWhitepayApiErrorMessage,
  translateWhitepayApiErrorMessage,
  resolveWhitepayClientError,
  parseWhitepayLiveNetworkFeeUnits,
  resolveWhitepayNetworkFeeUnits,
  formatNetworkFeeEstimateHint,
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

  it('estimates ERC20 stablecoin network fees around 1 unit, not the 9.54 ceiling', () => {
    expect(estimateNetworkFeeCentsSync('USDC', 'POLYGON')).toBe(100);
    expect(estimateNetworkFeeCentsSync('USDC', 'ERC20')).toBe(100);
    expect(estimateNetworkFeeCentsSync('USDT', 'TRC20')).toBe(100);
    expect(estimateNetworkFeeCentsSync('USDT', 'ERC20')).toBe(100);
  });

  it('includes network fees in total Whitepay fee calculation', () => {
    const fees = calculateWhitepayFees(10_000, 100);
    expect(fees.processingFeeCents).toBe(110);
    expect(fees.networkFeeCents).toBe(100);
    expect(fees.totalFeeCents).toBe(210);
  });

  it('uses live network_fees[NETWORK].fixed instead of the static ceiling', () => {
    expect(parseWhitepayLiveNetworkFeeUnits({ fixed: '0.6', max_amount: '0', min_amount: '10', is_memo_required: false })).toBe(0.6);
    expect(
      resolveWhitepayNetworkFeeUnits('USDC', 'ERC20', {
        fixed: '0.6',
        max_amount: '0',
        min_amount: '10',
        is_memo_required: false,
      })
    ).toEqual({ units: 0.6, source: 'live' });
    expect(resolveWhitepayNetworkFeeUnits('USDC', 'ERC20')).toEqual({ units: 1, source: 'static' });
    expect(
      formatNetworkFeeEstimateHint(
        'Frais réseau estimés : ~{amount} {ticker}, débit final au moment du transfert',
        0.6,
        'USDC'
      )
    ).toBe('Frais réseau estimés : ~0.6 USDC, débit final au moment du transfert');
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
