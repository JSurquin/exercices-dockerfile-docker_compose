/** Pays de la zone SEPA (EPC) acceptés pour SEPA Premium. */
export const SEPA_COUNTRY_CODES = new Set([
  'AD', 'AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB',
  'GI', 'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MC', 'MT', 'NL',
  'NO', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'SM', 'VA',
]);

/** Longueurs IBAN par code pays (registre SWIFT). */
export const IBAN_LENGTHS_BY_COUNTRY: Record<string, number> = {
  AD: 24, AT: 20, BE: 16, BG: 22, CH: 21, CY: 28, CZ: 24, DE: 22, DK: 18, EE: 20,
  ES: 24, FI: 18, FR: 27, GB: 22, GI: 23, GR: 27, HR: 21, HU: 28, IE: 22, IS: 26,
  IT: 27, LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MT: 31, NL: 18, NO: 15, PL: 28,
  PT: 25, RO: 24, SE: 24, SI: 19, SK: 24, SM: 27, VA: 22,
};

function mod97Check(cleanIban: string): boolean {
  const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);
  const numericIban = rearranged.replace(/[A-Z]/g, (char) =>
    (char.charCodeAt(0) - 55).toString()
  );
  let remainder = '';
  for (const char of numericIban) {
    remainder = ((parseInt(remainder + char, 10)) % 97).toString();
  }
  return parseInt(remainder, 10) === 1;
}

/**
 * Valide un IBAN de la zone SEPA : format, longueur par pays, checksum mod-97, pays SEPA.
 */
export function validateSepaIban(iban: string): { isValid: boolean; error?: string } {
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();

  if (cleanIban.length < 15 || cleanIban.length > 34) {
    return { isValid: false, error: 'IBAN invalide : longueur incorrecte' };
  }

  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleanIban)) {
    return { isValid: false, error: 'IBAN invalide : format incorrect' };
  }

  const country = cleanIban.slice(0, 2);
  if (!SEPA_COUNTRY_CODES.has(country)) {
    return { isValid: false, error: 'IBAN invalide : pays hors zone SEPA' };
  }

  const expectedLength = IBAN_LENGTHS_BY_COUNTRY[country];
  if (expectedLength !== undefined && cleanIban.length !== expectedLength) {
    return { isValid: false, error: 'IBAN invalide : longueur incorrecte pour ce pays' };
  }

  if (!mod97Check(cleanIban)) {
    return { isValid: false, error: 'IBAN invalide : checksum incorrect' };
  }

  return { isValid: true };
}

/** IBAN français — utilisé pour router vers SEPA Premium et bloquer le SEPA standard. */
export function isFrenchIban(iban: string): boolean {
  return iban.replace(/\s/g, '').toUpperCase().startsWith('FR');
}
