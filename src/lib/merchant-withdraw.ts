import crypto from 'crypto';
import { prisma } from '~/prisma/prisma';
import { encrypt } from '@/lib/encryption';
import { validateSepaIban, SEPA_COUNTRY_CODES } from '@/lib/iban-sepa';
import {
  validateWalletAddress,
  isWhitepayCryptoNetworkSupported,
  getWhitepayCryptoByTicker,
  networkRequiresMemo,
} from '@/lib/whitepay';
import { PayoutLifecycle } from '@/lib/payout-lifecycle';
import { isMerchantAccount } from '@/lib/user-rewards-guard';

export const MERCHANT_WITHDRAW_PREFIX = 'MOON-MERCHANT-WD-';
export const MERCHANT_WITHDRAW_MAX_PENDING = 3;
export const MERCHANT_WITHDRAW_MIN_CENTS = 1000;
export const MERCHANT_WITHDRAW_MAX_CENTS = 1_000_000_00;

export type MerchantWithdrawSubtype = 'bank' | 'crypto';

export type MerchantWithdrawBankDetails = {
  subtype: 'bank';
  accountHolder: string;
  iban: string;
  bic: string;
  country: string;
};

export type MerchantWithdrawCryptoDetails = {
  subtype: 'crypto';
  asset: string;
  network: string;
  address: string;
  memo?: string;
};

export type MerchantWithdrawDetails = MerchantWithdrawBankDetails | MerchantWithdrawCryptoDetails;

const BIC_REGEX = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

export function isMerchantWithdrawReference(ref: string | null | undefined): boolean {
  return !!ref?.startsWith(MERCHANT_WITHDRAW_PREFIX);
}

export function isMerchantWithdrawPayout(opts: {
  method?: string;
  gateFiOrderId?: string | null;
}): boolean {
  return opts.method === 'MERCHANT_WITHDRAW' || isMerchantWithdrawReference(opts.gateFiOrderId);
}

/** Client-facing status for merchant withdraw (display only — DB/API unchanged). */
export function merchantWithdrawClientDisplayStatus(status: string): string {
  if (status.toUpperCase() === 'PENDING_APPROVAL') return 'PROCESSING';
  return status;
}

export function clientDisplayPayoutStatus(
  status: string,
  opts?: { method?: string; gateFiOrderId?: string | null },
): string {
  if (isMerchantWithdrawPayout(opts ?? {})) {
    return merchantWithdrawClientDisplayStatus(status);
  }
  return status;
}

export function generateMerchantWithdrawReference(idempotencyKey?: string): string {
  const suffix = idempotencyKey
    ? crypto.createHash('sha256').update(idempotencyKey).digest('hex').slice(0, 16).toUpperCase()
    : crypto.randomBytes(8).toString('hex').toUpperCase();
  return `${MERCHANT_WITHDRAW_PREFIX}${Date.now()}-${suffix}`;
}

export function validateBic(bic: string): { isValid: boolean; error?: string } {
  const clean = bic.replace(/\s/g, '').toUpperCase();
  if (!BIC_REGEX.test(clean)) {
    return { isValid: false, error: 'Format BIC invalide' };
  }
  return { isValid: true };
}

export function validateMerchantWithdrawDetails(
  details: MerchantWithdrawDetails,
): { isValid: boolean; error?: string } {
  if (details.subtype === 'bank') {
    const ibanClean = details.iban.replace(/\s/g, '').toUpperCase();
    const ibanValidation = validateSepaIban(ibanClean);
    if (!ibanValidation.isValid) {
      return { isValid: false, error: ibanValidation.error ?? 'IBAN invalide' };
    }

    const country = details.country.replace(/\s/g, '').toUpperCase();
    if (!SEPA_COUNTRY_CODES.has(country)) {
      return { isValid: false, error: 'Pays hors zone SEPA' };
    }
    if (ibanClean.slice(0, 2) !== country) {
      return { isValid: false, error: 'Le pays ne correspond pas à l\'IBAN' };
    }

    const bicValidation = validateBic(details.bic);
    if (!bicValidation.isValid) {
      return { isValid: false, error: bicValidation.error };
    }

    if (!details.accountHolder?.trim()) {
      return { isValid: false, error: 'Titulaire du compte requis' };
    }

    return { isValid: true };
  }

  const asset = details.asset.toUpperCase();
  const network = details.network.toUpperCase();

  if (!getWhitepayCryptoByTicker(asset)) {
    return { isValid: false, error: `Crypto non supportée: ${asset}` };
  }
  if (!isWhitepayCryptoNetworkSupported(asset, network)) {
    return { isValid: false, error: `Réseau ${network} non supporté pour ${asset}` };
  }

  const addressValidation = validateWalletAddress(details.address.trim(), network);
  if (!addressValidation.isValid) {
    return { isValid: false, error: addressValidation.error };
  }

  if (networkRequiresMemo(network) && !details.memo?.trim()) {
    return { isValid: false, error: `Un memo/tag est requis pour le réseau ${network}` };
  }

  return { isValid: true };
}

export function maskMerchantWithdrawDetails(details: MerchantWithdrawDetails): Record<string, string> {
  if (details.subtype === 'bank') {
    const iban = details.iban.replace(/\s/g, '').toUpperCase();
    return {
      subtype: 'bank',
      accountHolder: details.accountHolder,
      maskedIban: iban.length >= 8 ? iban.slice(0, 4) + '****' + iban.slice(-4) : '****',
      country: details.country.toUpperCase(),
    };
  }
  const addr = details.address.trim();
  return {
    subtype: 'crypto',
    asset: details.asset.toUpperCase(),
    network: details.network.toUpperCase(),
    maskedAddress: addr.length > 12 ? addr.slice(0, 6) + '...' + addr.slice(-4) : '****',
  };
}

export function encryptMerchantWithdrawDetails(details: MerchantWithdrawDetails): string {
  const normalized =
    details.subtype === 'bank'
      ? {
          ...details,
          iban: details.iban.replace(/\s/g, '').toUpperCase(),
          bic: details.bic.replace(/\s/g, '').toUpperCase(),
          country: details.country.toUpperCase(),
          accountHolder: details.accountHolder.trim(),
        }
      : {
          ...details,
          asset: details.asset.toUpperCase(),
          network: details.network.toUpperCase(),
          address: details.address.trim(),
          memo: details.memo?.trim() || undefined,
        };
  return encrypt(JSON.stringify(normalized));
}

export async function assertMerchantUser(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { userTag: true },
  });
  if (!isMerchantAccount(user)) {
    throw new MerchantWithdrawForbiddenError();
  }
}

export class MerchantWithdrawForbiddenError extends Error {
  constructor() {
    super('Forbidden');
    this.name = 'MerchantWithdrawForbiddenError';
  }
}

export async function countMerchantPendingWithdrawals(userId: string): Promise<number> {
  return prisma.payout.count({
    where: {
      userId,
      gateFiOrderId: { startsWith: MERCHANT_WITHDRAW_PREFIX },
      status: { in: ['PENDING_APPROVAL', 'PROCESSING'] },
    },
  });
}

export async function findMerchantWithdrawByReference(reference: string) {
  return prisma.payout.findUnique({
    where: { gateFiOrderId: reference },
    include: { user: { select: { id: true } } },
  });
}

export async function createMerchantWithdrawRequest(params: {
  userId: string;
  amountCents: number;
  details: MerchantWithdrawDetails;
  idempotencyKey?: string;
  paymentMethodId: string;
}): Promise<{ payoutId: string; reference: string; created: boolean }> {
  const { userId, amountCents, details, idempotencyKey, paymentMethodId } = params;
  const reference = generateMerchantWithdrawReference(idempotencyKey);

  if (idempotencyKey) {
    const idemRef = `${MERCHANT_WITHDRAW_PREFIX}IDEM-${crypto.createHash('sha256').update(`${userId}:${idempotencyKey}`).digest('hex').slice(0, 24).toUpperCase()}`;
    const existing = await prisma.payout.findUnique({ where: { gateFiOrderId: idemRef } });
    if (existing) {
      return { payoutId: existing.id, reference: existing.gateFiOrderId!, created: false };
    }
  }

  const pendingCount = await countMerchantPendingWithdrawals(userId);
  if (pendingCount >= MERCHANT_WITHDRAW_MAX_PENDING) {
    throw new Error('MAX_PENDING_REACHED');
  }

  const encryptedPayload = encryptMerchantWithdrawDetails(details);
  const idemRef = idempotencyKey
    ? `${MERCHANT_WITHDRAW_PREFIX}IDEM-${crypto.createHash('sha256').update(`${userId}:${idempotencyKey}`).digest('hex').slice(0, 24).toUpperCase()}`
    : reference;

  const payout = await prisma.payout.create({
    data: {
      userId,
      status: 'PENDING_APPROVAL',
      amountCents,
      paymentMethodId,
      gateFiOrderId: idemRef,
      processingFeeCents: 0,
      networkFeeCents: 0,
      pendingFlexifyRequestEncrypted: encryptedPayload,
    },
  });

  try {
    await PayoutLifecycle.onCreated(userId, payout.id, amountCents);
  } catch (freezeErr) {
    await prisma.payout.update({
      where: { id: payout.id },
      data: { status: 'FAILED', errorMessage: 'freeze_failed' },
    });
    if (freezeErr instanceof Error && freezeErr.message === 'INSUFFICIENT_AVAILABLE_BALANCE') {
      throw new Error('INSUFFICIENT_AVAILABLE_BALANCE');
    }
    throw freezeErr;
  }

  if (idemRef !== reference) {
    await prisma.payout.update({
      where: { id: payout.id },
      data: { paymentReference: reference },
    });
  }

  return { payoutId: payout.id, reference: idemRef, created: true };
}
