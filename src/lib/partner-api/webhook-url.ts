const BLOCKED_HOSTS = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.internal',
]);

function stripIpv6Brackets(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, '').toLowerCase();
}

function isPrivateIpv4(host: string): boolean {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return false;
  const parts = host.split('.').map(Number);
  if (parts.some((part) => part > 255)) return false;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

function isPrivateOrLocalHostname(hostname: string): boolean {
  const host = stripIpv6Brackets(hostname);
  if (BLOCKED_HOSTS.has(host) || host.endsWith('.localhost') || host.endsWith('.local')) {
    return true;
  }
  if (isPrivateIpv4(host)) return true;
  if (host === '::1' || host === '::' || host === '0:0:0:0:0:0:0:1') return true;
  if (host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:')) return true;
  return false;
}

export function assertPublicHttpsWebhookUrl(
  url: string
): { ok: true } | { ok: false; error: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: 'Invalid webhook URL' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, error: 'Webhook URL must use HTTPS' };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, error: 'Webhook URL must not include credentials' };
  }
  if (!parsed.hostname) {
    return { ok: false, error: 'Invalid webhook URL' };
  }
  if (isPrivateOrLocalHostname(parsed.hostname)) {
    return { ok: false, error: 'Webhook URL must not target a private or local address' };
  }

  return { ok: true };
}
