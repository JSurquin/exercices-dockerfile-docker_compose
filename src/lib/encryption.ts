/**
 * Chiffrement AES-256-GCM pour données sensibles (IBAN, etc.).
 * Clé attendue : ENCRYPTION_KEY = 32 bytes en hex (64 caractères) ou base64.
 * Génération : node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY?.trim();
  console.log('getKey raw:', raw, 'length:', raw?.length);
  if (!raw) {
    throw new Error('ENCRYPTION_KEY absente');
  }

  let key: Buffer;

  // Hex strict: 64 caractères hex = 32 bytes
  if (raw.length === 64 && /^[0-9a-fA-F]{64}$/.test(raw)) {
    key = Buffer.from(raw, 'hex');
  } else {
    // Base64 fallback
    key = Buffer.from(raw, 'base64');
  }

  if (key.length !== KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY invalide: ${key.length} bytes (attendu ${KEY_LENGTH})`);
  }

  return key;
}

/**
 * Chiffre une chaîne avec AES-256-GCM.
 * Format stocké : base64(iv + authTag + ciphertext)
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  if (key.length !== KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY doit faire ${KEY_LENGTH} bytes`);
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  console.log('encrypt iv length:', iv.length, 'authTag length:', authTag.length, 'ciphertext length:', enc.length);
  return Buffer.concat([iv, authTag, enc]).toString('base64');
}

/**
 * Déchiffre une chaîne produite par encrypt().
 */
export function decrypt(ciphertextBase64: string): string {
  const key = getKey();
  const buf = Buffer.from(ciphertextBase64, 'base64');
  if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Données chiffrées invalides');
  }
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const enc = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  console.log('decrypt iv length:', iv.length, 'authTag length:', authTag.length, 'ciphertext length:', enc.length);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  return decipher.update(enc) + decipher.final('utf8');
}

/**
 * Masque un IBAN pour affichage : garde les 4 premiers et les 4 derniers.
 * Ex: FR7612345678901234567890123 -> FR76 **** **** **** **** **** 0123
 */
export function maskIban(iban: string): string {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  if (clean.length < 8) return '****';
  const start = clean.slice(0, 4);
  const end = clean.slice(-4);
  const n = Math.ceil((clean.length - 8) / 4);
  const middle = Array(n).fill('****').join(' ');
  return [start, middle, end].filter(Boolean).join(' ');
}
