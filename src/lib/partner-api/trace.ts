import { AsyncLocalStorage } from 'node:async_hooks';
import { writeSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import type { NextRequest } from 'next/server';

const PREFIX = '[PARTNER-TRACE]';
const storage = new AsyncLocalStorage<string>();

export function newPartnerTraceId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 12);
}

export function getPartnerTraceId(): string | undefined {
  return storage.getStore();
}

export function heapMb(): number {
  return Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
}

/**
 * Sync stdout so the last line survives a crash (Dokploy / Cloudflare 502).
 * Do not log secrets, signatures, or full API keys.
 */
export function partnerTrace(step: string, extra?: Record<string, unknown>): void {
  const traceId = storage.getStore() ?? 'no-id';
  const payload = extra ? ` ${JSON.stringify(extra)}` : '';
  const line = `${PREFIX} id=${traceId} ${step}${payload}\n`;
  try {
    writeSync(1, line);
  } catch {
    console.log(line.trim());
  }
}

export function runPartnerTrace<T>(traceId: string, fn: () => T): T {
  return storage.run(traceId, fn);
}

export async function withPartnerTrace(
  request: NextRequest,
  endpoint: string,
  method: string,
  run: () => Promise<Response>
): Promise<Response> {
  const traceId = newPartnerTraceId();
  return runPartnerTrace(traceId, async () => {
    partnerTrace('route.enter', {
      endpoint,
      method,
      hasBearer: Boolean(request.headers.get('authorization')?.startsWith('Bearer ')),
      heapMb: heapMb(),
    });
    try {
      const response = await run();
      partnerTrace('route.return', {
        endpoint,
        status: response.status,
        heapMb: heapMb(),
      });
      return response;
    } catch (err) {
      partnerTrace('route.throw', {
        endpoint,
        error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
        heapMb: heapMb(),
      });
      throw err;
    }
  });
}
