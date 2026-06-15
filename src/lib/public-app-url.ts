function normalizePublicUrl(url: string): string {
  return url.replace(/\/$/, '');
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
    try {
      origins.add(new URL(normalizePublicUrl(raw)).origin);
    } catch {
      origins.add(normalizePublicUrl(raw));
    }
  }

  return [...origins];
}
