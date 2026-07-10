import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import {
  homePopupPatchSchema,
  normalizeOptionalText,
  parseOptionalDate,
} from '@/lib/validation/schemas/home-popup';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = homePopupPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.titleFr !== undefined) data.titleFr = parsed.data.titleFr.trim();
    if (parsed.data.titleEn !== undefined) data.titleEn = parsed.data.titleEn.trim();
    if (parsed.data.titleCn !== undefined) {
      data.titleCn = normalizeOptionalText(parsed.data.titleCn ?? null);
    }
    if (parsed.data.messageFr !== undefined) data.messageFr = parsed.data.messageFr.trim();
    if (parsed.data.messageEn !== undefined) data.messageEn = parsed.data.messageEn.trim();
    if (parsed.data.messageCn !== undefined) {
      data.messageCn = normalizeOptionalText(parsed.data.messageCn ?? null);
    }
    if (parsed.data.ctaUrl !== undefined) {
      data.ctaUrl = normalizeOptionalText(parsed.data.ctaUrl ?? null);
    }
    if (parsed.data.ctaLabelFr !== undefined) {
      data.ctaLabelFr = normalizeOptionalText(parsed.data.ctaLabelFr ?? null);
    }
    if (parsed.data.ctaLabelEn !== undefined) {
      data.ctaLabelEn = normalizeOptionalText(parsed.data.ctaLabelEn ?? null);
    }
    if (parsed.data.ctaLabelCn !== undefined) {
      data.ctaLabelCn = normalizeOptionalText(parsed.data.ctaLabelCn ?? null);
    }
    if (parsed.data.status !== undefined) data.status = parsed.data.status;
    if (parsed.data.priority !== undefined) data.priority = parsed.data.priority;
    if (parsed.data.startsAt !== undefined) {
      data.startsAt = parseOptionalDate(parsed.data.startsAt ?? null);
    }
    if (parsed.data.endsAt !== undefined) {
      data.endsAt = parseOptionalDate(parsed.data.endsAt ?? null);
    }

    const popup = await prisma.homePopup.update({
      where: { id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'HOME_POPUP_UPDATED',
        details: { popupId: popup.id, status: popup.status },
      },
    });

    return NextResponse.json({ popup });
  } catch (error) {
    console.error('[admin home-popups PATCH]', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.homePopup.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'HOME_POPUP_DELETED',
        details: { popupId: id },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin home-popups DELETE]', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
