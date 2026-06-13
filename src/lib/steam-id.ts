/** Base SteamID64 pour convertir un accountid (paramètre `partner` du trade link) en SteamID64. */
const STEAMID64_ACCOUNT_BASE = BigInt('76561197960265728');

const STEAMID64_REGEX = /^7656119\d{10}$/;

export function isValidSteamId64(id: string): boolean {
  return STEAMID64_REGEX.test(id.trim());
}

export function getSteamProfileUrl(steamId64: string): string {
  return `https://steamcommunity.com/profiles/${steamId64.trim()}`;
}

/**
 * Accepte un SteamID64 ou une URL / fragment contenant `partner=` (trade link Steam).
 */
export function parseSteamId64FromUserInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (isValidSteamId64(trimmed)) return trimmed.trim();

  const tryFromUrl = (href: string): string | null => {
    try {
      const u = new URL(href);
      const partner = u.searchParams.get('partner');
      if (partner && /^\d+$/.test(partner)) {
        return (BigInt(partner) + STEAMID64_ACCOUNT_BASE).toString();
      }
    } catch {
      /* ignore */
    }
    return null;
  };

  const fromHttp = tryFromUrl(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
  if (fromHttp) return fromHttp;

  const m = trimmed.match(/[?&]partner=(\d+)/i);
  if (m?.[1] && /^\d+$/.test(m[1])) {
    return (BigInt(m[1]) + STEAMID64_ACCOUNT_BASE).toString();
  }

  return null;
}
