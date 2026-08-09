import {
  validateMerchantWithdrawDetails,
  validateBic,
  isMerchantWithdrawReference,
  clientDisplayPayoutStatus,
  MERCHANT_WITHDRAW_PREFIX,
} from '@/lib/merchant-withdraw';

describe('merchant-withdraw', () => {
  it('identifie les références merchant withdraw', () => {
    expect(isMerchantWithdrawReference(`${MERCHANT_WITHDRAW_PREFIX}123`)).toBe(true);
    expect(isMerchantWithdrawReference('MOON-SEPA-FR-123')).toBe(false);
  });

  it('mappe PENDING_APPROVAL en Processing côté client pour les retraits merchant', () => {
    expect(
      clientDisplayPayoutStatus('PENDING_APPROVAL', { method: 'MERCHANT_WITHDRAW' }),
    ).toBe('PROCESSING');
    expect(
      clientDisplayPayoutStatus('PENDING_APPROVAL', { gateFiOrderId: `${MERCHANT_WITHDRAW_PREFIX}abc` }),
    ).toBe('PROCESSING');
    expect(clientDisplayPayoutStatus('PENDING_APPROVAL', { method: 'SEPA_FR' })).toBe('PENDING_APPROVAL');
    expect(clientDisplayPayoutStatus('PROCESSING', { method: 'MERCHANT_WITHDRAW' })).toBe('PROCESSING');
  });

  it('valide un IBAN et BIC bancaires', () => {
    const result = validateMerchantWithdrawDetails({
      subtype: 'bank',
      accountHolder: 'Jean Dupont',
      iban: 'DE89370400440532013000',
      bic: 'COBADEFFXXX',
      country: 'DE',
    });
    expect(result.isValid).toBe(true);
  });

  it('rejette un IBAN avec checksum invalide', () => {
    const result = validateMerchantWithdrawDetails({
      subtype: 'bank',
      accountHolder: 'Jean Dupont',
      iban: 'DE89370400440532013001',
      bic: 'COBADEFFXXX',
      country: 'DE',
    });
    expect(result.isValid).toBe(false);
  });

  it('valide une adresse crypto TRC20', () => {
    const result = validateMerchantWithdrawDetails({
      subtype: 'crypto',
      asset: 'USDT',
      network: 'TRC20',
      address: 'T123456789012345678901234567890123',
    });
    expect(result.isValid).toBe(true);
  });

  it('rejette une combinaison asset/réseau non supportée', () => {
    const result = validateMerchantWithdrawDetails({
      subtype: 'crypto',
      asset: 'USDT',
      network: 'BTC',
      address: 'TJYvLQc8eJhF8B6T9K9K9K9K9K9K9K9K9',
    });
    expect(result.isValid).toBe(false);
  });

  it('valide le format BIC', () => {
    expect(validateBic('COBADEFFXXX').isValid).toBe(true);
    expect(validateBic('INVALID').isValid).toBe(false);
  });
});
