const OPTIMIZABLE_HOST =
  /(?:steamstatic\.com|steamcommunity-a\.akamaihd\.net|steamcdn-a\.akamaihd\.net|ytimg\.com|img\.youtube\.com|yt3\.ggpht\.com)/i;

export function isSteamImageUrl(src: string): boolean {
  return /(?:steamstatic\.com|steamcommunity-a\.akamaihd\.net|steamcdn-a\.akamaihd\.net)/i.test(src);
}

export function shouldUseNextImageOptimizer(src: string): boolean {
  if (!src) return false;
  if (src.startsWith('/') && !src.startsWith('//')) return true;
  return OPTIMIZABLE_HOST.test(src);
}
