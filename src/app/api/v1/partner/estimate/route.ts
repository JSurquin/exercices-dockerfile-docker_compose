import type { NextRequest } from 'next/server';
import { withPartnerApi } from '@/lib/partner-api/handler';
import { partnerSuccess, partnerError } from '@/lib/partner-api/response';
import { partnerEstimateSchema } from '@/lib/partner-api/schemas';
import { estimatePartnerItems } from '@/lib/partner-api/trade-service';
import { safeParseJson } from '@/lib/validation/helpers';

export async function POST(request: NextRequest) {
  return withPartnerApi(
    request,
    { endpoint: '/api/v1/partner/estimate', method: 'POST', scopes: ['read'] },
    async (req, ctx) => {
      const raw = await req.json();
      const parsed = safeParseJson(raw, partnerEstimateSchema, { errorStyle: 'successFalse' });
      if (!parsed.ok) return parsed.response;

      const result = await estimatePartnerItems(ctx.userId, parsed.data.asset_ids);
      if (!result.ok) {
        return partnerError('VALIDATION_ERROR', result.error, result.status);
      }

      return partnerSuccess(result);
    }
  );
}
