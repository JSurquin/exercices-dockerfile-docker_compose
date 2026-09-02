const BLOCKED_HOSTS = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.internal',
  'kubernetes.default',
  'kubernetes.default.svc',
]);

function stripIpv6Brackets(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, '').toLowerCase();
}

/** POSIX-style inet_aton: 1–4 decimal parts, or a single 32-bit integer. */
function parseIpv4Parts(host: string): [number, number, number, number] | null {
  if (/^\d+$/.test(host)) {
    const n = Number(host);
    if (!Number.isSafeInteger(n) || n < 0 || n > 0xffffffff) return null;
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  }

  const parts = host.split('.');
  if (parts.length < 2 || parts.length > 4) return null;
  if (parts.some((part) => !/^\d+$/.test(part))) return null;

  const nums = parts.map(Number);
  if (parts.length === 4) {
    if (nums.some((n) => n > 255)) return null;
    return [nums[0], nums[1], nums[2], nums[3]];
  }
  if (parts.length === 3) {
    if (nums[0] > 255 || nums[1] > 255 || nums[2] > 0xffff) return null;
    return [nums[0], nums[1], (nums[2] >> 8) & 255, nums[2] & 255];
  }
  if (nums[0] > 255 || nums[1] > 0xffffff) return null;
  return [nums[0], (nums[1] >> 16) & 255, (nums[1] >> 8) & 255, nums[1] & 255];
}

export function isPrivateIpv4(host: string): boolean {
  const parts = parseIpv4Parts(host);
  if (!parts) return false;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

function expandIpv6(host: string): string[] | null {
  if (!host.includes(':')) return null;
  const lower = host.toLowerCase();
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return null;
  const sides = lower.split('::');
  if (sides.length > 2) return null;
  const head = sides[0] ? sides[0].split(':') : [];
  const tail = sides[1] ? sides[1].split(':') : [];
  if (head.concat(tail).some((part) => part && !/^[0-9a-f]{1,4}$/.test(part))) return null;
  const missing = 8 - (head.length + tail.length);
  if (sides.length === 2) {
    if (missing < 0) return null;
    return [...head, ...Array(missing).fill('0'), ...tail];
  }
  if (head.length !== 8) return null;
  return head;
}

export function isPrivateOrLocalAddress(address: string): boolean {
  const host = stripIpv6Brackets(address);
  if (BLOCKED_HOSTS.has(host) || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return true;
  }
  if (isPrivateIpv4(host)) return true;

  const v4mapped = host.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (v4mapped && isPrivateIpv4(v4mapped[1])) return true;

  const groups = expandIpv6(host);
  if (groups) {
    const first = parseInt(groups[0] || '0', 16);
    const second = parseInt(groups[1] || '0', 16);
    if (groups.slice(0, 7).every((g) => !parseInt(g || '0', 16)) && parseInt(groups[7] || '0', 16) <= 1) {
      return true;
    }
    if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
    if (first === 0xfe80) return true; // link-local
    if (first === 0x2001 && second === 0xdb8) return true; // documentation
  } else if (host.includes(':')) {
    if (host === '::1' || host === '::' || host === '0:0:0:0:0:0:0:1') return true;
    if (host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:')) return true;
  }

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
  if (isPrivateOrLocalAddress(parsed.hostname)) {
    return { ok: false, error: 'Webhook URL must not target a private or local address' };
  }

  return { ok: true };
}

export async function assertSafeWebhookDeliveryUrl(
  url: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const staticCheck = assertPublicHttpsWebhookUrl(url);
  if (!staticCheck.ok) return staticCheck;

  const hostname = stripIpv6Brackets(new URL(url).hostname);
  try {
    const { promises: dns } = await import('node:dns');
    const records = await dns.lookup(hostname, { all: true, verbatim: true });
    if (records.length === 0) {
      return { ok: false, error: 'Webhook URL host could not be resolved' };
    }
    for (const record of records) {
      if (isPrivateOrLocalAddress(record.address)) {
        return { ok: false, error: 'Webhook URL must not resolve to a private or local address' };
      }
    }
  } catch {
    return { ok: false, error: 'Webhook URL host could not be resolved' };
  }

  return { ok: true };
}
