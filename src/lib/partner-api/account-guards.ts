import type { PartnerErrorCode } from '@/lib/partner-api/response';

export type PartnerAccountFields = {
  steamId: string | null;
  acceptedTermsAt: Date | null;
  tradeLink: string | null;
};

export type PartnerAccountGuardFailure = {
  ok: false;
  code: PartnerErrorCode;
  message: string;
  status: number;
};

export type PartnerAccountGuardResult = { ok: true } | PartnerAccountGuardFailure;

export function assertPartnerSteamLinked(
  user: Pick<PartnerAccountFields, 'steamId'>
): PartnerAccountGuardResult {
  if (!user.steamId) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'Steam ID is not linked to this account',
      status: 400,
    };
  }
  return { ok: true };
}

export function assertPartnerTermsAccepted(
  user: Pick<PartnerAccountFields, 'acceptedTermsAt'>
): PartnerAccountGuardResult {
  if (!user.acceptedTermsAt) {
    return {
      ok: false,
      code: 'TERMS_REQUIRED',
      message: 'Terms of service must be accepted before using the partner API',
      status: 403,
    };
  }
  return { ok: true };
}

export function assertPartnerTradeLinkConfigured(
  user: Pick<PartnerAccountFields, 'tradeLink'>
): PartnerAccountGuardResult {
  if (!user.tradeLink) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'Trade link is not configured on this account',
      status: 400,
    };
  }
  return { ok: true };
}

/** Steam + CGV, and optionally a saved Trade Link (quote section 8). */
export function assertPartnerAccountReady(
  user: PartnerAccountFields,
  options: { requireTradeLink?: boolean } = {}
): PartnerAccountGuardResult {
  const steam = assertPartnerSteamLinked(user);
  if (!steam.ok) return steam;
  const terms = assertPartnerTermsAccepted(user);
  if (!terms.ok) return terms;
  if (options.requireTradeLink) {
    const link = assertPartnerTradeLinkConfigured(user);
    if (!link.ok) return link;
  }
  return { ok: true };
}

export function partnerAccountGuardFrMessage(result: PartnerAccountGuardFailure): string {
  switch (result.code) {
    case 'TERMS_REQUIRED':
      return 'Les CGV doivent être acceptées avant de générer une clé API.';
    case 'VALIDATION_ERROR':
      if (result.message.includes('Steam')) {
        return 'Le compte Steam doit être lié avant de générer une clé API.';
      }
      return 'Le Trade Link Steam doit être configuré avant de générer une clé API.';
    default:
      return result.message;
  }
}
