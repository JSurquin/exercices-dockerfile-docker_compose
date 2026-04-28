import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getPlatformConfig,
  setPlatformConfigValue,
  resetPlatformConfigValue,
  PLATFORM_CONFIG_KEYS,
  PLATFORM_CONFIG_DEFAULTS,
  PlatformConfigKey,
} from '@/lib/platform-config-service';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

// GET — retourne la config courante + indique si chaque valeur vient de la DB
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const [config, dbRows] = await Promise.all([
      getPlatformConfig(),
      prisma.siteSettings.findMany({
        where: { key: { in: Object.values(PLATFORM_CONFIG_KEYS) } },
        select: { key: true },
      }),
    ]);

    const keysInDb = new Set(dbRows.map(r => r.key));

    return NextResponse.json({
      config,
      defaults: PLATFORM_CONFIG_DEFAULTS,
      sources: Object.fromEntries(
        Object.values(PLATFORM_CONFIG_KEYS).map(k => [k, keysInDb.has(k) ? 'db' : 'env'])
      ),
    });
  } catch (error) {
    console.error('[platform-config GET]', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

const patchSchema = z.object({
  key: z.enum(Object.values(PLATFORM_CONFIG_KEYS) as [PlatformConfigKey, ...PlatformConfigKey[]]),
  value: z.union([z.number(), z.string()]),
});

const resetSchema = z.object({
  key: z.enum(Object.values(PLATFORM_CONFIG_KEYS) as [PlatformConfigKey, ...PlatformConfigKey[]]),
  reset: z.literal(true),
});

// PATCH — met à jour une valeur  |  PATCH + reset:true — réinitialise sur env/constante
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();

    // Réinitialisation
    const resetResult = resetSchema.safeParse(body);
    if (resetResult.success) {
      await resetPlatformConfigValue(resetResult.data.key);
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'PLATFORM_CONFIG_RESET',
          details: { key: resetResult.data.key },
          ipAddress:
            request.headers.get('x-forwarded-for') ??
            request.headers.get('x-real-ip') ??
            'unknown',
        },
      });
      const config = await getPlatformConfig();
      return NextResponse.json({ success: true, config });
    }

    // Mise à jour
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { key, value } = parsed.data;
    await setPlatformConfigValue(key, value, session.user.id);

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PLATFORM_CONFIG_UPDATED',
        details: { key, value },
        ipAddress:
          request.headers.get('x-forwarded-for') ??
          request.headers.get('x-real-ip') ??
          'unknown',
      },
    });

    const config = await getPlatformConfig();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('[platform-config PATCH]', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
