import type { NextRequest } from 'next/server';
import { requireApiKey } from '@/lib/partner-api/auth';
import { partnerTrace } from '@/lib/partner-api/trace';

type PartnerHandler = (
  request: NextRequest,
  ctx: import('@/lib/partner-api/auth').PartnerApiContext
) => Promise<Response>;

export async function withPartnerApi(
  request: NextRequest,
  options: { endpoint: string; method: string; scopes?: string[]; anyOfScopes?: string[] },
  handler: PartnerHandler
): Promise<Response> {
  partnerTrace('auth.start', { endpoint: options.endpoint, method: options.method });
  let auth: Awaited<ReturnType<typeof requireApiKey>>;
  try {
    auth = await requireApiKey(request, {
      endpoint: options.endpoint,
      method: options.method,
      requiredScopes: options.scopes,
      ...(options.anyOfScopes ? { requiredAnyScopes: options.anyOfScopes } : {}),
    });
  } catch (err) {
    partnerTrace('auth.throw', {
      endpoint: options.endpoint,
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    });
    throw err;
  }

  if (!auth.ok) {
    partnerTrace('auth.fail', {
      endpoint: options.endpoint,
      status: auth.response.status,
    });
    if (auth.logApiCall && auth.startMs !== undefined) {
      await auth.logApiCall(auth.response.status, auth.startMs);
    }
    return auth.response;
  }

  partnerTrace('auth.ok', {
    endpoint: options.endpoint,
    userId: auth.ctx.userId,
    apiClientId: auth.ctx.apiClientId,
  });

  try {
    partnerTrace('handler.start', { endpoint: options.endpoint });
    const response = await handler(request, auth.ctx);
    partnerTrace('handler.done', { endpoint: options.endpoint, status: response.status });
    await auth.logApiCall(response.status, auth.startMs);
    partnerTrace('handler.logged', { endpoint: options.endpoint });
    return response;
  } catch (err) {
    partnerTrace('handler.throw', {
      endpoint: options.endpoint,
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    });
    console.error(`[PartnerAPI] ${options.endpoint}`, err);
    const { partnerError } = await import('@/lib/partner-api/response');
    const res = partnerError('INTERNAL_ERROR', 'Internal server error', 500);
    await auth.logApiCall(500, auth.startMs);
    return res;
  }
}
