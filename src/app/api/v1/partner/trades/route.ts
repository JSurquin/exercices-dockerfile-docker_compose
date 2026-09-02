import type { NextRequest } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { withPartnerApi } from '@/lib/partner-api/handler';
import {
  partnerSuccess,
  partnerError,
  formatTradeForPartner,
  formatCreatedTradeForPartner,
  toPartnerErrorCode,
} from '@/lib/partner-api/response';
import { partnerCreateTradeSchema } from '@/lib/partner-api/schemas';
import { createPartnerTrade } from '@/lib/partner-api/trade-service';
import { parsePartnerPagination, readPartnerJsonBody, safeParsePartnerJson } from '@/lib/partner-api/validation';
import { partnerTrace, withPartnerTrace } from '@/lib/partner-api/trace';

export async function GET(request: NextRequest) {
  return withPartnerTrace(request, '/api/v1/partner/trades', 'GET', () =>
    withPartnerApi(
      request,
      { endpoint: '/api/v1/partner/trades', method: 'GET', scopes: ['read'] },
      async (req, ctx) => {
        const pagination = parsePartnerPagination(new URL(req.url).searchParams);
        if (!pagination.ok) return pagination.response;
        const { limit, offset } = pagination.data;

        const where = { userId: ctx.userId };
        const [trades, total] = await Promise.all([
          prisma.trade.findMany({
            where,
            include: { items: true },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
          }),
          prisma.trade.count({ where }),
        ]);

        return partnerSuccess({
          trades: trades.map((t) => formatTradeForPartner(t)),
          pagination: { limit, offset, total },
        });
      }
    )
  );
}

export async function POST(request: NextRequest) {
  return withPartnerTrace(request, '/api/v1/partner/trades', 'POST', () =>
    withPartnerApi(
      request,
      { endpoint: '/api/v1/partner/trades', method: 'POST', scopes: ['trade'] },
      async (req, ctx) => {
        const raw = await readPartnerJsonBody(req);
        if (!raw.ok) return raw.response;

        const parsed = safeParsePartnerJson(raw.data, partnerCreateTradeSchema);
        if (!parsed.ok) return parsed.response;

        const assetIds = parsed.data.items.map((i) => i.asset_id);
        partnerTrace('trades.create.start', { userId: ctx.userId, assetCount: assetIds.length });
        const result = await createPartnerTrade(ctx.userId, {
          tradeUrl: parsed.data.trade_url,
          assetIds,
        });

        if (!result.ok) {
          partnerTrace('trades.create.fail', { code: result.code, status: result.status });
          return partnerError(toPartnerErrorCode(result.code), result.error, result.status, result.extra);
        }

        partnerTrace('trades.create.ok', { tradeId: result.trade.id });
        return partnerSuccess(formatCreatedTradeForPartner(result.trade), 201);
      }
    )
  );
}
