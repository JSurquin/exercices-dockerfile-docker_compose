import { normalizeSteamTradeLink, parseSteamId64FromUserInput } from '@/lib/steam-id';

export function validatePartnerTradeUrl(
  tradeUrl: string,
  userSteamId: string,
  userTradeLink: string
): { ok: true } | { ok: false; error: string } {
  const urlSteamId = parseSteamId64FromUserInput(tradeUrl);
  if (!urlSteamId || urlSteamId !== userSteamId) {
    return { ok: false, error: "L'URL de trade ne correspond pas au compte Steam lié" };
  }

  const normalizedInput = normalizeSteamTradeLink(tradeUrl);
  const normalizedAccount = normalizeSteamTradeLink(userTradeLink);
  if (!normalizedInput || !normalizedAccount || normalizedInput !== normalizedAccount) {
    return {
      ok: false,
      error: "L'URL de trade doit correspondre au trade link enregistré sur le compte",
    };
  }

  return { ok: true };
}
