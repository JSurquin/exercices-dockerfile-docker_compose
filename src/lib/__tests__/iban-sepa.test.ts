import { validateSepaIban, isFrenchIban } from '../iban-sepa';

describe('iban-sepa', () => {
  it('valide un IBAN français', () => {
    expect(validateSepaIban('FR7630006000011234567890189').isValid).toBe(true);
  });

  it('valide un IBAN allemand', () => {
    expect(validateSepaIban('DE89370400440532013000').isValid).toBe(true);
  });

  it('valide un IBAN belge', () => {
    expect(validateSepaIban('BE68539007547034').isValid).toBe(true);
  });

  it('rejette un IBAN hors zone SEPA', () => {
    const result = validateSepaIban('US64SVBKUS6S3300958879');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('hors zone SEPA');
  });

  it('rejette un IBAN avec checksum invalide', () => {
    const result = validateSepaIban('FR7630006000011234567890188');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('checksum');
  });

  it('rejette un IBAN FR de mauvaise longueur', () => {
    const result = validateSepaIban('FR76300060000112345678901');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('longueur');
  });

  it('detecte un IBAN français', () => {
    expect(isFrenchIban('FR76 3000 6000 0112 3456 7890 189')).toBe(true);
    expect(isFrenchIban('DE89370400440532013000')).toBe(false);
  });
});
