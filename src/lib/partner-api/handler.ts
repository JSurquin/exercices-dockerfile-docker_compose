import type { NextRequest } from 'next/server';
import { requireApiKey } from '@/lib/partner-api/auth';

type PartnerHandler = (
  request: NextRequest,
  ctx: import('@/lib/partner-api/auth').PartnerApiContext
) => Promise<Response>;

export async function withPartnerApi(
  request: NextRequest,
  options: { endpoint: string; method: string; scopes?: string[]; anyOfScopes?: string[] },
  handler: PartnerHandler
): Promise<Response> {
  const auth = await requireApiKey(request, {
    endpoint: options.endpoint,
    method: options.method,
    requiredScopes: options.scopes,
    ...(options.anyOfScopes ? { requiredAnyScopes: options.anyOfScopes } : {}),
  });
  if (!auth.ok) return auth.response;

  try {
    const response = await handler(request, auth.ctx);
    const status = response.status;
    await auth.logApiCall(status, auth.startMs);
    return response;
  } catch (err) {
    console.error(`[PartnerAPI] ${options.endpoint}`, err);
    const { partnerError } = await import('@/lib/partner-api/response');
    const res = partnerError('INTERNAL_ERROR', 'Internal server error', 500);
    await auth.logApiCall(500, auth.startMs);
    return res;
  }
}
