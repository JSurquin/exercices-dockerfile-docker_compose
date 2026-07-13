import type { NextRequest } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { withPartnerApi } from '@/lib/partner-api/handler';
import { partnerSuccess, partnerError, formatTradeForPartner } from '@/lib/partner-api/response';
import { partnerCreateTradeSchema } from '@/lib/partner-api/schemas';
import { createPartnerTrade } from '@/lib/partner-api/trade-service';
import { safeParseJson } from '@/lib/validation/helpers';

export async function GET(request: NextRequest) {
  return withPartnerApi(
    request,
    { endpoint: '/api/v1/partner/trades', method: 'GET', scopes: ['read'] },
    async (req, ctx) => {
      const { searchParams } = new URL(req.url);
      const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
      const offset = parseInt(searchParams.get('offset') || '0', 10);

      const trades = await prisma.trade.findMany({
        where: { userId: ctx.userId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return partnerSuccess({
        trades: trades.map((t) => formatTradeForPartner(t)),
        pagination: { limit, offset, count: trades.length },
      });
    }
  );
}

export async function POST(request: NextRequest) {
  return withPartnerApi(
    request,
    { endpoint: '/api/v1/partner/trades', method: 'POST', scopes: ['trade'] },
    async (req, ctx) => {
      const raw = await req.json();
      const parsed = safeParseJson(raw, partnerCreateTradeSchema, { errorStyle: 'successFalse' });
      if (!parsed.ok) return parsed.response;

      const assetIds = parsed.data.items.map((i) => i.asset_id);
      const result = await createPartnerTrade(ctx.userId, {
        tradeUrl: parsed.data.trade_url,
        assetIds,
      });

      if (!result.ok) {
        const code =
          result.code === 'ACCOUNT_FROZEN'
            ? 'ACCOUNT_FROZEN'
            : result.code === 'RATE_LIMITED'
              ? 'RATE_LIMITED'
              : result.code === 'CONFIG_ERROR'
                ? 'CONFIG_ERROR'
                : 'VALIDATION_ERROR';
        return partnerError(code as 'VALIDATION_ERROR', result.error, result.status);
      }

      return partnerSuccess(
        {
          trade_id: result.trade.id,
          ticket_id: result.trade.ticketId,
          statut: result.trade.status,
          brut_centimes: result.trade.grossCents,
          net_centimes: result.trade.netCents,
          frais: { cashout: result.trade.cashoutFees, réseau: result.trade.networkFees },
          expires_at: result.trade.expiresAt?.toISOString() ?? null,
          disponible_le: result.trade.availableAt?.toISOString() ?? null,
        },
        201
      );
    }
  );
}
