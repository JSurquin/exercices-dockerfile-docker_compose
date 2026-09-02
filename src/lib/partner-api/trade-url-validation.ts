import {
  isValidSteamId64,
  normalizeSteamTradeLink,
  parseSteamId64FromUserInput,
} from '@/lib/steam-id';

/**
 * Steam ID used for inventory / estimate / sale — same rule as the sell page:
 * trade-link account first, then the Steam ID linked at login.
 */
export function getPartnerOperatingSteamId(user: {
  steamId: string | null;
  tradeLink: string | null;
}): string | null {
  if (user.tradeLink) {
    const fromLink = parseSteamId64FromUserInput(user.tradeLink);
    if (fromLink) return fromLink;
  }
  const linked = user.steamId?.trim() ?? '';
  return linked && isValidSteamId64(linked) ? linked : null;
}

export function parsePartnerTradeUrl(
  tradeUrl: string
): { ok: true; steamId: string; normalized: string } | { ok: false; error: string } {
  const normalized = normalizeSteamTradeLink(tradeUrl);
  const steamId = parseSteamId64FromUserInput(normalized ?? tradeUrl);
  if (!normalized || !steamId) {
    return { ok: false, error: 'Invalid Steam trade URL' };
  }
  return { ok: true, steamId, normalized };
}

/**
 * Per-request trade URL (any valid Steam trade link). Does not need to match
 * the Trade Link saved in Settings.
 */
export function validatePartnerTradeUrl(
  tradeUrl: string,
  _userSteamId?: string,
  _userTradeLink?: string
): { ok: true; steamId: string } | { ok: false; error: string } {
  const parsed = parsePartnerTradeUrl(tradeUrl);
  if (!parsed.ok) return parsed;
  return { ok: true, steamId: parsed.steamId };
}

export function resolvePartnerOperatingSteamId(
  user: { steamId: string | null; tradeLink: string | null } | null,
  tradeUrl?: string | null
): { ok: true; steamId: string } | { ok: false; error: string } {
  if (tradeUrl) {
    return validatePartnerTradeUrl(tradeUrl);
  }
  const steamId = user ? getPartnerOperatingSteamId(user) : null;
  if (!steamId) {
    return {
      ok: false,
      error: 'Pass trade_url or save a Steam Trade Link on the account',
    };
  }
  return { ok: true, steamId };
}
