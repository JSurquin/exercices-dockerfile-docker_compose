import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { z } from 'zod';
import {
  ADMIN_DEFAULT_TIMEZONE,
  ADMIN_DEFAULT_SESSION_TIMEOUT_MINUTES,
  ADMIN_DEFAULT_THEME,
  ADMIN_DEFAULT_LANGUAGE,
  ADMIN_DEFAULT_DASHBOARD_LAYOUT,
} from '@/lib/admin-constants';

const DEFAULT_METADATA = {
  notifications: {
    emailNotifications: true,
    tradeAlerts: true,
    securityAlerts: true,
    weeklyReports: false,
  },
  preferences: {
    theme: ADMIN_DEFAULT_THEME,
    language: ADMIN_DEFAULT_LANGUAGE,
    timezone: ADMIN_DEFAULT_TIMEZONE,
    dashboardLayout: ADMIN_DEFAULT_DASHBOARD_LAYOUT,
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: ADMIN_DEFAULT_SESSION_TIMEOUT_MINUTES,
  },
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        steamId: true,
        steamUsername: true,
        steamAvatar: true,
        createdAt: true,
        adminMetadata: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const stored = (user.adminMetadata ?? {}) as Record<string, unknown>;

    const metadata = {
      notifications: {
        ...DEFAULT_METADATA.notifications,
        ...((stored.notifications as object) ?? {}),
      },
      preferences: {
        ...DEFAULT_METADATA.preferences,
        ...((stored.preferences as object) ?? {}),
      },
      security: {
        ...DEFAULT_METADATA.security,
        ...((stored.security as object) ?? {}),
      },
    };

    return NextResponse.json({
      personalInfo: {
        name: user.name ?? '',
        email: user.email ?? '',
        steamUsername: user.steamUsername ?? '',
        avatar: user.image ?? user.steamAvatar ?? '',
        createdAt: user.createdAt,
      },
      ...metadata,
    });
  } catch (error) {
    console.error('Admin settings GET error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

const patchSchema = z.object({
  notifications: z
    .object({
      emailNotifications: z.boolean(),
      tradeAlerts: z.boolean(),
      securityAlerts: z.boolean(),
      weeklyReports: z.boolean(),
    })
    .optional(),
  preferences: z
    .object({
      theme: z.enum(['dark', 'light', 'auto']),
      language: z.enum(['fr', 'en']),
      timezone: z.string(),
      dashboardLayout: z.enum(['grid', 'list', 'compact']),
    })
    .optional(),
  security: z
    .object({
      twoFactorEnabled: z.boolean(),
      sessionTimeout: z.number().int().positive(),
    })
    .optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const patch = patchSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { adminMetadata: true },
    });

    const current = (user?.adminMetadata ?? {}) as Record<string, unknown>;

    const updated = {
      ...current,
      ...(patch.notifications ? { notifications: patch.notifications } : {}),
      ...(patch.preferences ? { preferences: patch.preferences } : {}),
      ...(patch.security ? { security: patch.security } : {}),
    };

    await prisma.user.update({
      where: { id: session.user.id },
      data: { adminMetadata: updated },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'admin.settings_updated',
        details: {
          updatedSections: Object.keys(patch),
          severity: 'low',
          timestamp: new Date().toISOString(),
        },
        ipAddress:
          request.headers.get('x-forwarded-for') ??
          request.headers.get('x-real-ip') ??
          'unknown',
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    console.error('Admin settings PATCH error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
