import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import {
  homePopupBodySchema,
  normalizeOptionalText,
  parseOptionalDate,
} from '@/lib/validation/schemas/home-popup';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const popups = await prisma.homePopup.findMany({
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ popups });
  } catch (error) {
    console.error('[admin home-popups GET]', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = homePopupBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const popup = await prisma.homePopup.create({
      data: {
        titleFr: parsed.data.titleFr.trim(),
        titleEn: parsed.data.titleEn.trim(),
        titleCn: normalizeOptionalText(parsed.data.titleCn ?? null),
        messageFr: parsed.data.messageFr.trim(),
        messageEn: parsed.data.messageEn.trim(),
        messageCn: normalizeOptionalText(parsed.data.messageCn ?? null),
        ctaUrl: normalizeOptionalText(parsed.data.ctaUrl ?? null),
        ctaLabelFr: normalizeOptionalText(parsed.data.ctaLabelFr ?? null),
        ctaLabelEn: normalizeOptionalText(parsed.data.ctaLabelEn ?? null),
        ctaLabelCn: normalizeOptionalText(parsed.data.ctaLabelCn ?? null),
        status: parsed.data.status ?? 'DRAFT',
        priority: parsed.data.priority ?? 0,
        startsAt: parseOptionalDate(parsed.data.startsAt ?? null),
        endsAt: parseOptionalDate(parsed.data.endsAt ?? null),
        createdBy: session.user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'HOME_POPUP_CREATED',
        details: { popupId: popup.id, status: popup.status },
      },
    });

    return NextResponse.json({ popup }, { status: 201 });
  } catch (error) {
    console.error('[admin home-popups POST]', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
