import { NextRequest, NextResponse } from 'next/server';
import { requireUserSession } from '@/lib/require-session-user';
import { safeParseJson } from '@/lib/validation/helpers';
import { affiliateGiveawayRequestPostSchema } from '@/lib/validation/schemas/affiliate';
import {
  AffiliateGiveawayRequestError,
  AffiliateGiveawayRequestService,
} from '@/lib/affiliate-giveaway-request-service';

export async function GET(request: NextRequest) {
  try {
    const session = await requireUserSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentification requise' }, { status: 401 });
    }

    const data = await AffiliateGiveawayRequestService.listForUser(session.user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AffiliateGiveawayRequestError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error('[api/affiliate/giveaway-requests GET]', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireUserSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentification requise' }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, affiliateGiveawayRequestPostSchema, { errorStyle: 'affiliate' });
    if (!parsed.ok) {
      return parsed.response;
    }

    const { startDate, endDate, winnerCount, costCents, adminMessage, requireAffiliateCode } =
      parsed.data;

    const requestRow = await AffiliateGiveawayRequestService.submitRequest(session.user.id, {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      winnerCount,
      costCents,
      adminMessage,
      requireAffiliateCode,
    });

    return NextResponse.json({ success: true, data: requestRow }, { status: 201 });
  } catch (error) {
    if (error instanceof AffiliateGiveawayRequestError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error('[api/affiliate/giveaway-requests POST]', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
