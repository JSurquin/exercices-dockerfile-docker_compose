/**
 * Helpers pour les moyens de paiement SEPA : chiffrement IBAN/BIC au repos,
 * masquage pour l’API, migration lazy de l’ancien format (plain) vers chiffré.
 */
import { encrypt, decrypt, maskIban } from './encryption';

export interface SepaPayload {
  iban: string;
  bic: string;
}

export interface SepaDetailsStored {
  type: 'SEPA';
  /** Payload chiffré (JSON stringifié de { iban, bic }) */
  encryptedPayload?: string;
  /** IBAN masqué pour affichage (ex: FR76 **** **** 0123) */
  maskedIban?: string;
  /** BIC masqué (ex: BNPA****) */
  maskedBic?: string;
  /** @deprecated Ancien format : IBAN en clair. Migré vers encryptedPayload au premier read. */
  iban?: string;
  /** @deprecated Ancien format */
  bic?: string;
}

/** Détails SEPA exposés au client (jamais d’IBAN/BIC en clair). */
export interface SepaDetailsPublic {
  type: 'SEPA';
  maskedIban: string;
  maskedBic: string;
}

const BIC_MASK_LEN = 4;

function maskBic(bic: string): string {
  const clean = (bic || '').replace(/\s/g, '').toUpperCase();
  if (clean.length <= BIC_MASK_LEN) return '****';
  return clean.slice(0, BIC_MASK_LEN) + '****';
}

/**
 * Chiffre iban/bic et produit l’objet à stocker dans PaymentMethod.details.
 */
export function buildEncryptedSepaDetails(iban: string, bic: string): SepaDetailsStored {
  const payload: SepaPayload = {
    iban: iban.replace(/\s/g, '').toUpperCase(),
    bic: (bic || '').replace(/\s/g, '').toUpperCase(),
  };
  const encryptedPayload = encrypt(JSON.stringify(payload));
  return {
    type: 'SEPA',
    encryptedPayload,
    maskedIban: maskIban(payload.iban),
    maskedBic: maskBic(payload.bic),
  };
}

/**
 * Déchiffre les détails SEPA (après migration lazy si besoin).
 * À n’utiliser que côté serveur pour appeler Flexify, etc.
 */
export function getDecryptedSepaPayload(details: SepaDetailsStored | null): SepaPayload | null {
  if (!details || details.type !== 'SEPA') return null;

  // Nouveau format
  if (details.encryptedPayload) {
    try {
      const raw = decrypt(details.encryptedPayload);
      return JSON.parse(raw) as SepaPayload;
    } catch {
      return null;
    }
  }

  // Ancien format (plain) : on retourne pour usage immédiat, la migration sera faite par l’appelant
  if (typeof details.iban === 'string' && details.iban) {
    return {
      iban: details.iban.replace(/\s/g, '').toUpperCase(),
      bic: (details.bic as string) || '',
    };
  }

  return null;
}

/**
 * Retourne les détails SEPA à exposer au client (masqués uniquement).
 */
export function getPublicSepaDetails(details: SepaDetailsStored | null): SepaDetailsPublic | null {
  if (!details || details.type !== 'SEPA') return null;
  return {
    type: 'SEPA',
    maskedIban: details.maskedIban ?? maskIban((details.iban as string) || ''),
    maskedBic: details.maskedBic ?? maskBic((details.bic as string) || ''),
  };
}

/**
 * Si details est en ancien format (iban en clair), retourne un nouvel objet
 * avec encryptedPayload + masked*, sinon retourne undefined (déjà migré).
 */
export function migrateToEncryptedDetails(details: SepaDetailsStored | null): SepaDetailsStored | undefined {
  if (!details || details.type !== 'SEPA') return undefined;
  if (details.encryptedPayload) return undefined;
  const iban = typeof details.iban === 'string' ? details.iban : '';
  if (!iban) return undefined;
  return buildEncryptedSepaDetails(iban, (details.bic as string) || '');
}
