/**
 * Tests unitaires pour l'intégration Flexify
 * 
 * Pour exécuter : npm test src/lib/__tests__/flexify.test.ts
 */


import {
  validateIban,
  validateBic,
  validateCardNumber,
  calculateSepaFees,
  calculateCardFees,
  centsToEur,
  eurToCents,
  getPayoutLimits,
  convertFlexifyStatus,
  isTransactionCompleted,
  isTransactionFailed,
  isTransactionPending,
} from '../flexify';

describe('Flexify - Validation IBAN', () => {
  it('devrait valider un IBAN français correct', () => {
    const result = validateIban('FR7630006000011234567890189');
    expect(result.isValid).toBe(true);
  });

  it('devrait valider un IBAN avec espaces', () => {
    const result = validateIban('FR76 3000 6000 0112 3456 7890 189');
    expect(result.isValid).toBe(true);
  });

  it('devrait rejeter un IBAN trop court', () => {
    const result = validateIban('FR76');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('longueur incorrecte');
  });

  it('devrait rejeter un IBAN avec checksum invalide', () => {
    const result = validateIban('FR7630006000011234567890188'); // Dernier chiffre modifié
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('checksum incorrect');
  });

  it('devrait rejeter un format invalide', () => {
    const result = validateIban('ABCD1234567890');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('longueur incorrecte');
  });
});

describe('Flexify - Validation BIC', () => {
  it('devrait valider un BIC 8 caractères', () => {
    const result = validateBic('BNPAFRPP');
    expect(result.isValid).toBe(true);
  });

  it('devrait valider un BIC 11 caractères', () => {
    const result = validateBic('BNPAFRPP123');
    expect(result.isValid).toBe(true);
  });

  it('devrait rejeter un BIC trop court', () => {
    const result = validateBic('BNPA');
    expect(result.isValid).toBe(false);
  });

  it('devrait rejeter un BIC avec format invalide', () => {
    const result = validateBic('1234FRPP');
    expect(result.isValid).toBe(false);
  });
});

describe('Flexify - Validation Carte', () => {
  it('devrait valider un numéro Visa valide', () => {
    const result = validateCardNumber('4242424242424242');
    expect(result.isValid).toBe(true);
  });

  it('devrait valider un numéro avec espaces', () => {
    const result = validateCardNumber('4242 4242 4242 4242');
    expect(result.isValid).toBe(true);
  });

  it('devrait rejeter un numéro trop court', () => {
    const result = validateCardNumber('4242');
    expect(result.isValid).toBe(false);
  });

  it('devrait rejeter un numéro avec checksum invalide (Luhn)', () => {
    const result = validateCardNumber('4242424242424243');
    expect(result.isValid).toBe(false);
  });
});

describe('Flexify - Calcul des Frais', () => {
  it('devrait calculer les frais SEPA correctement', () => {
    const fees = calculateSepaFees(10000); // 100 EUR
    expect(fees.processingFeeCents).toBe(50); // 0.5%
    expect(fees.networkFeeCents).toBe(25); // 0.25 EUR fixe
    expect(fees.totalFeeCents).toBe(75);
  });

  it('devrait calculer les frais Carte correctement', () => {
    const fees = calculateCardFees(10000); // 100 EUR
    expect(fees.processingFeeCents).toBe(150); // 1.5%
    expect(fees.networkFeeCents).toBe(50); // 0.50 EUR fixe
    expect(fees.totalFeeCents).toBe(200);
  });

  it('devrait arrondir les frais au centime supérieur', () => {
    const fees = calculateSepaFees(12345); // 123.45 EUR
    expect(fees.processingFeeCents).toBe(62); // ceil(123.45 * 0.005)
  });
});

describe('Flexify - Conversion Montants', () => {
  it('devrait convertir centimes en EUR', () => {
    expect(centsToEur(10000)).toBe('100.00');
    expect(centsToEur(12345)).toBe('123.45');
    expect(centsToEur(99)).toBe('0.99');
  });

  it('devrait convertir EUR en centimes', () => {
    expect(eurToCents(100)).toBe(10000);
    expect(eurToCents(123.45)).toBe(12345);
    expect(eurToCents(0.99)).toBe(99);
  });
});

describe('Flexify - Limites de Payout', () => {
  it('devrait retourner les limites SEPA', () => {
    const limits = getPayoutLimits('sepa');
    expect(limits.minCents).toBe(1000); // 10 EUR
    expect(limits.maxCents).toBe(1000000); // 10,000 EUR
  });

  it('devrait retourner les limites Carte', () => {
    const limits = getPayoutLimits('card');
    expect(limits.minCents).toBe(500); // 5 EUR
    expect(limits.maxCents).toBe(500000); // 5,000 EUR
  });
});

describe('Flexify - Conversion Statuts', () => {
  it('devrait convertir les statuts Flexify vers internes', () => {
    expect(convertFlexifyStatus('new')).toBe('PENDING');
    expect(convertFlexifyStatus('pending')).toBe('PROCESSING');
    expect(convertFlexifyStatus('success')).toBe('PAID');
    expect(convertFlexifyStatus('declined')).toBe('FAILED');
    expect(convertFlexifyStatus('failed')).toBe('FAILED');
    expect(convertFlexifyStatus('expired')).toBe('FAILED');
  });
});

describe('Flexify - Vérification Statuts', () => {
  it('devrait identifier une transaction complétée', () => {
    expect(isTransactionCompleted('success')).toBe(true);
    expect(isTransactionCompleted('pending')).toBe(false);
  });

  it('devrait identifier une transaction échouée', () => {
    expect(isTransactionFailed('failed')).toBe(true);
    expect(isTransactionFailed('declined')).toBe(true);
    expect(isTransactionFailed('expired')).toBe(true);
    expect(isTransactionFailed('success')).toBe(false);
  });

  it('devrait identifier une transaction en cours', () => {
    expect(isTransactionPending('new')).toBe(true);
    expect(isTransactionPending('pending')).toBe(true);
    expect(isTransactionPending('success')).toBe(false);
  });
});
