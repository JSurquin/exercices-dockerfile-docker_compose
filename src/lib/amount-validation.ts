/**
 * Valide qu'un montant en centimes est un entier positif valide.
 * Accepte number ou string, retourne un entier positif ou null si invalide.
 * 
 * @param amount - Montant à valider (peut être number, string ou autre)
 * @returns number | null - Montant en centimes (entier positif) ou null si invalide
 */
export function validateAmountCents(amount: unknown): number | null {
  let amountCents: number;

  // Conversion depuis number
  if (typeof amount === 'number') {
    if (!Number.isFinite(amount) || amount <= 0) {
      return null;
    }
    amountCents = Math.floor(amount);
  }
  // Conversion depuis string
  else if (typeof amount === 'string') {
    const trimmed = amount.trim();
    if (trimmed === '') {
      return null;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    amountCents = Math.floor(parsed);
  }
  // Type invalide
  else {
    return null;
  }

  // Vérifier que c'est bien un entier positif
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return null;
  }

  return amountCents;
}

/**
 * Valide qu'un montant respecte les limites min/max.
 * 
 * @param amountCents - Montant en centimes
 * @param minCents - Montant minimum en centimes
 * @param maxCents - Montant maximum en centimes
 * @returns boolean - true si le montant est dans les limites
 */
export function isAmountInRange(
  amountCents: number,
  minCents: number,
  maxCents: number
): boolean {
  return amountCents >= minCents && amountCents <= maxCents;
}

/**
 * Valide et parse un montant depuis le body d'une requête.
 * Supporte les champs amountCents ou amount.
 * 
 * @param body - Corps de la requête (objet avec amountCents ou amount)
 * @returns { valid: true, amount: number } | { valid: false, error: string }
 */
export function parseAndValidateAmount(body: Record<string, unknown>): 
  | { valid: true; amount: number }
  | { valid: false; error: string } {
  
  const rawAmount = body.amountCents ?? body.amount;
  
  if (rawAmount === undefined || rawAmount === null) {
    return { valid: false, error: 'Montant manquant' };
  }

  const validatedAmount = validateAmountCents(rawAmount);
  
  if (validatedAmount === null) {
    return { valid: false, error: 'Montant invalide (doit être un entier positif en centimes)' };
  }

  return { valid: true, amount: validatedAmount };
}
