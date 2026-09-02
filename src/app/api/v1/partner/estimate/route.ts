import type { NextRequest } from 'next/server';
import { withPartnerApi } from '@/lib/partner-api/handler';
import { partnerSuccess, partnerError, toPartnerErrorCode } from '@/lib/partner-api/response';
import { partnerEstimateSchema } from '@/lib/partner-api/schemas';
import { estimatePartnerItems } from '@/lib/partner-api/trade-service';
import { partnerTrace, withPartnerTrace } from '@/lib/partner-api/trace';
import { readPartnerJsonBody, safeParsePartnerJson } from '@/lib/partner-api/validation';

export async function POST(request: NextRequest) {
  return withPartnerTrace(request, '/api/v1/partner/estimate', 'POST', () =>
    withPartnerApi(
      request,
      { endpoint: '/api/v1/partner/estimate', method: 'POST', scopes: ['read'] },
      async (req, ctx) => {
        const raw = await readPartnerJsonBody(req);
        if (!raw.ok) return raw.response;

        const parsed = safeParsePartnerJson(raw.data, partnerEstimateSchema);
        if (!parsed.ok) return parsed.response;

        partnerTrace('estimate.start', {
          userId: ctx.userId,
          assetCount: parsed.data.asset_ids.length,
        });
        const result = await estimatePartnerItems(ctx.userId, parsed.data.asset_ids);
        if (!result.ok) {
          partnerTrace('estimate.fail', { code: result.code, status: result.status });
          return partnerError(toPartnerErrorCode(result.code), result.error, result.status);
        }

        partnerTrace('estimate.ok', { gross_cents: result.data.gross_cents });
        return partnerSuccess(result.data);
      }
    )
  );
}
