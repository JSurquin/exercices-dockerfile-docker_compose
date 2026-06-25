import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { normalizeSteamTradeLink } from '@/lib/steam-id';
import {
  getRequestContext,
  logUnauthorizedAccess,
  logUserAction,
  logSensitiveDataChange,
  logSystemError,
} from '@/lib/security/audit-helpers';
import { AuditAction } from '@/lib/security';
import { safeParseJson } from '@/lib/validation/helpers';
import { userUpdateBodySchema } from '@/lib/validation/schemas/user';

export async function POST(request: NextRequest) {
  const context = getRequestContext(request);

  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      await logUnauthorizedAccess(context, '/api/user/update', 'No valid session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    context.userId = session.user.id;

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      raw = {};
    }

    if (
      typeof raw === 'object' &&
      raw !== null &&
      'tradeLink' in raw &&
      typeof (raw as { tradeLink?: unknown }).tradeLink === 'string' &&
      (raw as { tradeLink: string }).tradeLink
    ) {
      const normalized = normalizeSteamTradeLink((raw as { tradeLink: string }).tradeLink);
      if (normalized) {
        (raw as { tradeLink: string }).tradeLink = normalized;
      }
    }

    const parsed = safeParseJson(raw, userUpdateBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    const data = parsed.data;

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const steamIdValue = data.steamId64 ?? data.steamId;

    // Le steamId ne peut être défini qu'une seule fois (onboarding Discord).
    // Si l'user a déjà un steamId, on refuse silencieusement l'écrasement.
    const canSetSteamId = steamIdValue !== undefined && !currentUser.steamId;

    if (canSetSteamId) {
      const existingUser = await prisma.user.findUnique({
        where: { steamId: steamIdValue },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Ce Steam ID est déjà utilisé par un autre compte' },
          { status: 409 }
        );
      }
    }

    const filteredUpdates: Record<string, unknown> = {};
    if (data.name !== undefined) {
      filteredUpdates.name = data.name;
    }
    if (data.tradeLink !== undefined) {
      filteredUpdates.tradeLink = data.tradeLink === '' ? null : data.tradeLink;
    }
    if (canSetSteamId) {
      filteredUpdates.steamId = steamIdValue;
    }

    if (currentUser && data.tradeLink !== undefined) {
      const newValue = data.tradeLink === '' ? null : data.tradeLink;
      if (currentUser.tradeLink !== newValue) {
        await logSensitiveDataChange(
          context,
          'tradeLink',
          currentUser.tradeLink,
          newValue,
          AuditAction.PAYMENT_METHOD_UPDATED
        );
      }
    }

    let updatedUser;
    try {
      updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: filteredUpdates,
      });
    } catch (error: unknown) {
      const err = error as { code?: string; meta?: { target?: string[] } };
      if (err.code === 'P2002') {
        const field = err.meta?.target?.[0] || 'champ';
        return NextResponse.json(
          { error: `Ce ${field} est déjà utilisé par un autre compte` },
          { status: 409 }
        );
      }
      throw error;
    }

    await logUserAction(
      context,
      AuditAction.PAYMENT_METHOD_UPDATED,
      {
        type: 'profile_updated',
        updatedFields: Object.keys(filteredUpdates),
        timestamp: new Date().toISOString(),
      },
      'low'
    );

    const responseUser = {
      id: updatedUser.id,
      steamId64: updatedUser.steamId || '',
      username: updatedUser.name || updatedUser.steamUsername || 'User',
      avatar: updatedUser.image || updatedUser.steamAvatar || '',
      level: updatedUser.level,
      xp: updatedUser.xp,
      tickets: updatedUser.tickets,
      fragments: updatedUser.fragments ?? 0,
      totalVolume: updatedUser.totalVolumeCents,
      bonusRatePercent: updatedUser.bonusRatePercent ?? 0,
      userTag: updatedUser.userTag ?? null,
      kycStatus: updatedUser.kycStatus,
      acceptedTermsAt: updatedUser.acceptedTermsAt,
      tradeLink: updatedUser.tradeLink,
      joinedAt: updatedUser.createdAt,
    };

    return NextResponse.json(responseUser);
  } catch (error) {
    console.error('User update error:', error);

    await logSystemError(context, error, 'user_update');

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
