import { isValidSteamId64, parseSteamId64FromUserInput } from '@/lib/steam-id';

export interface SteamAccessUser {
  steamId: string | null;
  tradeLink: string | null;
}

/**
 * Steam IDs autorisés pour inventaire / création de trade :
 * compte Steam lié (DB prioritaire, puis session) + Steam ID du trade link enregistré.
 */
export function getAllowedSteamIds(
  sessionSteamId: string | null | undefined,
  dbUser: SteamAccessUser,
): string[] {
  const ids = new Set<string>();

  const linkedSteamId = (dbUser.steamId || sessionSteamId || '').trim();
  if (linkedSteamId && isValidSteamId64(linkedSteamId)) {
    ids.add(linkedSteamId);
  }

  if (dbUser.tradeLink) {
    const fromTradeLink = parseSteamId64FromUserInput(dbUser.tradeLink);
    if (fromTradeLink) {
      ids.add(fromTradeLink);
    }
  }

  return [...ids];
}

export function isSteamIdAllowedForUser(
  requestedSteamId: string,
  sessionSteamId: string | null | undefined,
  dbUser: SteamAccessUser,
): boolean {
  const normalized = requestedSteamId.trim();
  if (!isValidSteamId64(normalized)) return false;
  return getAllowedSteamIds(sessionSteamId, dbUser).includes(normalized);
}
