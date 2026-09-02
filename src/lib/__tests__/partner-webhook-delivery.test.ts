import { EventEmitter } from 'node:events';
import type { IncomingMessage } from 'node:http';
import type { RequestOptions as HttpsRequestOptions } from 'node:https';
import {
  isRetryableWebhookConnectError,
  pinnedHttpsRequestOptions,
  postPinnedHttps,
} from '@/lib/partner-api/webhook-delivery';
import {
  resolveSafeWebhookDeliveryTarget,
  type SafeWebhookDeliveryTarget,
} from '@/lib/partner-api/webhook-url';

const target: SafeWebhookDeliveryTarget = {
  href: 'https://hooks.partner.test:8443/webhooks/moonskin?x=1',
  hostname: 'hooks.partner.test',
  pins: [
    { address: '203.0.113.10', family: 4 },
    { address: '198.51.100.20', family: 4 },
  ],
};

function fakeRequest(
  onEnd: (
    req: EventEmitter,
    options: { hostname?: string; servername?: string; headers?: Record<string, unknown> },
    cb: (res: IncomingMessage) => void
  ) => void
) {
  return ((options: object, cb: (res: IncomingMessage) => void) => {
    const req = new EventEmitter() as EventEmitter & {
      write: () => boolean;
      end: () => void;
      destroy: () => void;
    };
    req.write = () => true;
    req.destroy = () => undefined;
    req.end = () => {
      onEnd(
        req,
        options as { hostname?: string; servername?: string; headers?: Record<string, unknown> },
        cb
      );
    };
    return req;
  }) as unknown as typeof import('node:https').request;
}

describe('pinned partner webhook delivery', () => {
  it('connects to the resolved IP while keeping SNI and Host on the original hostname', () => {
    const options = pinnedHttpsRequestOptions(target, target.pins[0], 10000);
    expect(options.hostname).toBe('203.0.113.10');
    expect(options.family).toBe(4);
    expect(options.port).toBe(8443);
    expect(options.path).toBe('/webhooks/moonskin?x=1');
    expect(options.servername).toBe('hooks.partner.test');
    expect(options.method).toBe('POST');
    expect(options.hostname).not.toBe(options.servername);
  });

  it('uses Host without a port for default HTTPS', () => {
    const options = pinnedHttpsRequestOptions(
      {
        href: 'https://hooks.partner.test/webhooks/moonskin',
        hostname: 'hooks.partner.test',
        pins: [{ address: '203.0.113.10', family: 4 }],
      },
      { address: '203.0.113.10', family: 4 },
      10000
    );
    expect(options.port).toBe(443);
    expect(options.path).toBe('/webhooks/moonskin');
  });

  it('POSTs to the pinned IP with the original Host header', async () => {
    const requestFn = fakeRequest((_req, options, cb) => {
      expect(options.hostname).toBe('203.0.113.10');
      expect(options.servername).toBe('hooks.partner.test');
      expect(options.headers?.host).toBe('hooks.partner.test:8443');
      const res = Object.assign(new EventEmitter(), {
        statusCode: 204,
        resume() {
          return this;
        },
      }) as IncomingMessage;
      cb(res);
      res.emit('end');
    });

    const result = await postPinnedHttps({
      target,
      headers: { 'Content-Type': 'application/json' },
      body: '{"ok":true}',
      requestFn,
    });
    expect(result.status).toBe(204);
  });

  it('retries the next public pin on a connect error', async () => {
    let attempt = 0;
    const requestFn = fakeRequest((req, options, cb) => {
      attempt += 1;
      if (attempt === 1) {
        const err = new Error('refused') as Error & { code: string };
        err.code = 'ECONNREFUSED';
        queueMicrotask(() => req.emit('error', err));
        return;
      }
      expect(options.hostname).toBe('198.51.100.20');
      const res = Object.assign(new EventEmitter(), {
        statusCode: 200,
        resume() {
          return this;
        },
      }) as IncomingMessage;
      cb(res);
      res.emit('end');
    });

    const result = await postPinnedHttps({
      target,
      headers: {},
      body: '{}',
      requestFn,
    });
    expect(result.status).toBe(200);
    expect(attempt).toBe(2);
  });

  it('does not retry a TLS certificate error on another pin', async () => {
    let attempt = 0;
    const requestFn = fakeRequest((req) => {
      attempt += 1;
      const err = new Error('bad cert') as Error & { code: string };
      err.code = 'UNABLE_TO_VERIFY_LEAF_SIGNATURE';
      queueMicrotask(() => req.emit('error', err));
    });

    await expect(postPinnedHttps({ target, headers: {}, body: '{}', requestFn })).rejects.toThrow('bad cert');
    expect(attempt).toBe(1);
    expect(isRetryableWebhookConnectError({ code: 'ECONNREFUSED' })).toBe(true);
    expect(isRetryableWebhookConnectError({ code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' })).toBe(false);
  });
});

describe('pinned partner webhook delivery (real HTTPS)', () => {
  it('POSTs to a pinned IPv4 with the original Host header', async () => {
    const { execFileSync } = await import('node:child_process');
    const { mkdtempSync, readFileSync, rmSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const https = await import('node:https');
    const dir = mkdtempSync(join(tmpdir(), 'moonskin-webhook-'));
    try {
      execFileSync(
        'openssl',
        [
          'req',
          '-x509',
          '-newkey',
          'rsa:2048',
          '-nodes',
          '-keyout',
          'key.pem',
          '-out',
          'cert.pem',
          '-days',
          '1',
          '-subj',
          '/CN=hooks.partner.test',
        ],
        { cwd: dir, stdio: 'pipe' }
      );
      const key = readFileSync(join(dir, 'key.pem'));
      const cert = readFileSync(join(dir, 'cert.pem'));
      const received = { host: '', body: '', url: '', method: '' };

      const server = https.createServer({ key, cert }, (req, res) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk) => chunks.push(chunk as Buffer));
        req.on('end', () => {
          received.host = String(req.headers.host ?? '');
          received.body = Buffer.concat(chunks).toString('utf8');
          received.url = req.url ?? '';
          received.method = req.method ?? '';
          res.statusCode = 204;
          res.end();
        });
      });

      await new Promise<void>((resolve) => {
        server.listen(0, '127.0.0.1', () => resolve());
      });
      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('expected a TCP port');
      }

      const agent = new https.Agent({ rejectUnauthorized: false });
      const requestFn = ((options: object, cb: (res: IncomingMessage) => void) =>
        https.request({ ...(options as HttpsRequestOptions), agent }, cb)) as unknown as typeof https.request;

      try {
        const result = await postPinnedHttps({
          target: {
            href: `https://hooks.partner.test:${address.port}/webhooks/moonskin?x=1`,
            hostname: 'hooks.partner.test',
            pins: [{ address: '127.0.0.1', family: 4 }],
          },
          headers: {
            'Content-Type': 'application/json',
            'X-MoonSkin-Event-Id': 'evt_1',
          },
          body: '{"ok":true}',
          requestFn,
        });
        expect(result.status).toBe(204);
        expect(received.method).toBe('POST');
        expect(received.url).toBe('/webhooks/moonskin?x=1');
        expect(received.host).toBe(`hooks.partner.test:${address.port}`);
        expect(received.body).toBe('{"ok":true}');
      } finally {
        agent.destroy();
        await new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        });
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reaches a public HTTPS host through a DNS pin and valid TLS', async () => {
    const resolved = await resolveSafeWebhookDeliveryTarget('https://example.com/');
    if (!resolved.ok) {
      throw new Error(resolved.error);
    }
    const result = await postPinnedHttps({
      target: resolved.target,
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'MoonSkin-Webhook/1.0' },
      body: '{}',
    });
    expect(result.status).toBeGreaterThanOrEqual(100);
    expect(result.status).toBeLessThan(600);
  });
});

