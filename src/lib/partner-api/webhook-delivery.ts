import https from 'node:https';
import type { IncomingMessage } from 'node:http';
import type { RequestOptions } from 'node:https';
import type { SafeWebhookDeliveryTarget, WebhookAddressPin } from '@/lib/partner-api/webhook-url';

const RETRYABLE_CONNECT_CODES = new Set([
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ETIMEDOUT',
  'ECONNRESET',
]);

export type PinnedHttpsRequestFn = typeof https.request;

export function pinnedHttpsRequestOptions(
  target: SafeWebhookDeliveryTarget,
  pin: WebhookAddressPin,
  timeoutMs: number
): RequestOptions {
  const url = new URL(target.href);
  return {
    hostname: pin.address,
    family: pin.family,
    port: url.port ? Number(url.port) : 443,
    path: `${url.pathname}${url.search}`,
    method: 'POST',
    servername: target.hostname,
    timeout: timeoutMs,
  };
}

export function isRetryableWebhookConnectError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('code' in error)) return false;
  return RETRYABLE_CONNECT_CODES.has(String((error as { code: unknown }).code));
}

function errorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code: unknown }).code);
  }
  return undefined;
}

function postOnce(
  target: SafeWebhookDeliveryTarget,
  pin: WebhookAddressPin,
  headers: Record<string, string>,
  body: string,
  timeoutMs: number,
  requestFn: PinnedHttpsRequestFn
): Promise<{ status: number }> {
  const url = new URL(target.href);
  const options = pinnedHttpsRequestOptions(target, pin, timeoutMs);
  options.headers = {
    ...headers,
    host: url.host,
    'Content-Length': String(Buffer.byteLength(body)),
  };

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error: Error | null, status?: number) => {
      if (settled) return;
      settled = true;
      if (error) reject(error);
      else resolve({ status: status ?? 0 });
    };

    const req = requestFn(options, (res: IncomingMessage) => {
      res.resume();
      res.on('error', (error) => finish(error));
      res.on('end', () => finish(null, res.statusCode ?? 0));
    });

    req.on('timeout', () => {
      const timeoutError = new Error('Webhook delivery timed out') as Error & { code: string };
      timeoutError.code = 'ETIMEDOUT';
      req.destroy(timeoutError);
      finish(timeoutError);
    });
    req.on('error', (error) => finish(error));
    req.write(body);
    req.end();
  });
}

export async function postPinnedHttps(params: {
  target: SafeWebhookDeliveryTarget;
  headers: Record<string, string>;
  body: string;
  timeoutMs?: number;
  requestFn?: PinnedHttpsRequestFn;
}): Promise<{ status: number }> {
  const { target, headers, body, timeoutMs = 10000, requestFn = https.request } = params;
  let lastError: unknown;

  for (const pin of target.pins) {
    try {
      return await postOnce(target, pin, headers, body, timeoutMs, requestFn);
    } catch (error) {
      lastError = error;
      if (!isRetryableWebhookConnectError(error)) {
        throw error;
      }
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error(lastError ? `Webhook delivery failed (${errorCode(lastError) ?? 'unknown'})` : 'Webhook delivery failed');
}
