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

export function validatePartnerTradeUrl(
  tradeUrl: string,
  userSteamId: string,
  userTradeLink: string
): { ok: true; steamId: string } | { ok: false; error: string } {
  const urlSteamId = parseSteamId64FromUserInput(tradeUrl);
  if (!urlSteamId) {
    return { ok: false, error: 'Trade URL does not match the linked Steam account' };
  }

  const allowed = new Set<string>();
  if (userSteamId && isValidSteamId64(userSteamId)) {
    allowed.add(userSteamId);
  }
  const linkSteamId = parseSteamId64FromUserInput(userTradeLink);
  if (linkSteamId) {
    allowed.add(linkSteamId);
  }

  if (!allowed.has(urlSteamId)) {
    return { ok: false, error: 'Trade URL does not match the linked Steam account' };
  }

  const normalizedInput = normalizeSteamTradeLink(tradeUrl);
  const normalizedAccount = normalizeSteamTradeLink(userTradeLink);
  if (!normalizedInput || !normalizedAccount || normalizedInput !== normalizedAccount) {
    return {
      ok: false,
      error: 'Trade URL must match the trade link saved on the account',
    };
  }

  return { ok: true, steamId: urlSteamId };
}
