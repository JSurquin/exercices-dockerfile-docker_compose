import { normalizeSteamTradeLink, parseSteamId64FromUserInput } from '@/lib/steam-id';

export function validatePartnerTradeUrl(
  tradeUrl: string,
  userSteamId: string,
  userTradeLink: string
): { ok: true } | { ok: false; error: string } {
  const urlSteamId = parseSteamId64FromUserInput(tradeUrl);
  if (!urlSteamId || urlSteamId !== userSteamId) {
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

  return { ok: true };
}
