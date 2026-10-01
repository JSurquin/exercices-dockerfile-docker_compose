import { sanitizePayoutAmountInput } from '@/lib/payout-amount-input';

describe('sanitizePayoutAmountInput', () => {
  it('laisse un montant valide inchangé', () => {
    expect(sanitizePayoutAmountInput('1234567.89')).toBe('1234567.89');
    expect(sanitizePayoutAmountInput('10')).toBe('10');
    expect(sanitizePayoutAmountInput('')).toBe('');
  });

  it('cap à 7 chiffres avant la virgule', () => {
    expect(sanitizePayoutAmountInput('12345678')).toBe('1234567');
    expect(sanitizePayoutAmountInput('1234567890123.45')).toBe('1234567.45');
  });

  it('cap à 2 chiffres après la virgule', () => {
    expect(sanitizePayoutAmountInput('12.345')).toBe('12.34');
    expect(sanitizePayoutAmountInput('12.34999')).toBe('12.34');
  });

  it('accepte la virgule et conserve un séparateur en cours de saisie', () => {
    expect(sanitizePayoutAmountInput('12,5')).toBe('12.5');
    expect(sanitizePayoutAmountInput('12,')).toBe('12.');
    expect(sanitizePayoutAmountInput('12.')).toBe('12.');
  });

  it('ignore les caractères non numériques', () => {
    expect(sanitizePayoutAmountInput('1e10')).toBe('110');
    expect(sanitizePayoutAmountInput('abc12.3def4')).toBe('12.34');
  });
});
