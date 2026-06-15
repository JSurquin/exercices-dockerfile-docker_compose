function normalizePublicUrl(url: string): string {
  return url.replace(/\/$/, '');
}

function expandOriginVariants(raw: string): string[] {
  try {
    const url = new URL(normalizePublicUrl(raw));
    const variants = new Set<string>([url.origin]);
    const host = url.hostname;

    if (host.startsWith('www.')) {
      variants.add(`${url.protocol}//${host.slice(4)}`);
    } else if (!host.includes('localhost') && !host.startsWith('127.')) {
      variants.add(`${url.protocol}//www.${host}`);
    }

    return [...variants];
  } catch {
    return [normalizePublicUrl(raw)];
  }
}

export function resolvePublicAppUrl(fallbackOrigin?: string): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.BETTER_AUTH_URL ||
    fallbackOrigin ||
    'http://localhost:3000';
  return normalizePublicUrl(configured);
}

export function getTrustedAuthOrigins(): string[] {
  const origins = new Set<string>();

  for (const raw of [
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_URL,
  ]) {
    if (!raw) continue;
    for (const origin of expandOriginVariants(raw)) {
      origins.add(origin);
    }
  }

  return [...origins];
}
