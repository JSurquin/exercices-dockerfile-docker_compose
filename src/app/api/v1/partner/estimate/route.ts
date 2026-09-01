import type { NextRequest } from 'next/server';
import { withPartnerApi } from '@/lib/partner-api/handler';
import { partnerSuccess, partnerError, toPartnerErrorCode } from '@/lib/partner-api/response';
import { partnerEstimateSchema } from '@/lib/partner-api/schemas';
import { estimatePartnerItems } from '@/lib/partner-api/trade-service';
import { readPartnerJsonBody, safeParsePartnerJson } from '@/lib/partner-api/validation';

export async function POST(request: NextRequest) {
  return withPartnerApi(
    request,
    { endpoint: '/api/v1/partner/estimate', method: 'POST', scopes: ['read'] },
    async (req, ctx) => {
      const raw = await readPartnerJsonBody(req);
      if (!raw.ok) return raw.response;

      const parsed = safeParsePartnerJson(raw.data, partnerEstimateSchema);
      if (!parsed.ok) return parsed.response;

      const result = await estimatePartnerItems(ctx.userId, parsed.data.asset_ids);
      if (!result.ok) {
        return partnerError(toPartnerErrorCode(result.code), result.error, result.status);
      }

      return partnerSuccess(result.data);
    }
  );
}
