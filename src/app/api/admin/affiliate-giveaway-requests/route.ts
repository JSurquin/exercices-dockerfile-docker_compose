import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { safeParseJson, safeParseSearchParams } from '@/lib/validation/helpers';
import {
  adminAffiliateGiveawayRequestPostSchema,
  adminAffiliateGiveawayRequestsListQuerySchema,
} from '@/lib/validation/schemas/admin-bodies';
import {
  AffiliateGiveawayRequestError,
  AffiliateGiveawayRequestService,
} from '@/lib/affiliate-giveaway-request-service';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Accès non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = safeParseSearchParams(searchParams, adminAffiliateGiveawayRequestsListQuerySchema, {
      errorStyle: 'successFalse',
    });
    if (!parsed.ok) {
      return parsed.response;
    }

    const data = await AffiliateGiveawayRequestService.listForAdmin({
      status: parsed.data.status ?? 'all',
      page: parsed.data.page,
      limit: parsed.data.limit,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[api/admin/affiliate-giveaway-requests GET]', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Accès non autorisé' }, { status: 403 });
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, adminAffiliateGiveawayRequestPostSchema, {
      errorStyle: 'successFalse',
    });
    if (!parsed.ok) {
      return parsed.response;
    }

    const { action, requestId, data } = parsed.data;

    if (action === 'approve') {
      if (!data?.title || !data.description || !data.prize) {
        return NextResponse.json(
          { success: false, error: 'title, description et prize sont requis pour approuver' },
          { status: 400 }
        );
      }

      const result = await AffiliateGiveawayRequestService.approveRequest(
        session.user.id,
        requestId,
        {
          title: data.title,
          description: data.description,
          prize: data.prize,
          prizeImageUrl: data.prizeImageUrl,
          steamMarketHashName: data.steamMarketHashName,
          rewardValueCents: data.rewardValueCents,
          ticketPrice: data.ticketPrice,
          maxTickets: data.maxTickets,
        }
      );

      return NextResponse.json({ success: true, data: result });
    }

    if (action === 'reject') {
      const updated = await AffiliateGiveawayRequestService.rejectRequest(
        session.user.id,
        requestId,
        data?.rejectionReason
      );
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: 'Action non reconnue' }, { status: 400 });
  } catch (error) {
    if (error instanceof AffiliateGiveawayRequestError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error('[api/admin/affiliate-giveaway-requests POST]', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
