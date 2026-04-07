import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { z } from 'zod';
import { emailService } from '@/lib/email';

const SMTP_KEYS = [
  'smtp_host',
  'smtp_port',
  'smtp_user',
  'smtp_password',
  'smtp_from',
  'smtp_secure',
  'smtp_alert_email_to',
  'smtp_bcc_admin_enabled',
] as const;

const smtpSchema = z.object({
  host: z.string().min(1).optional(),
  port: z.coerce.number().int().positive().optional(),
  user: z.string().min(1).optional(),
  password: z.string().optional(),
  from: z.string().email().optional(),
  secure: z.boolean().optional(),
  alertEmailTo: z.string().email().optional(),
  bccAdminEnabled: z.boolean().optional(),
});

export type SmtpSettingsPayload = z.infer<typeof smtpSchema>;

export interface SmtpSettingsResponse {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
  secure: boolean;
  alertEmailTo: string;
  bccAdminEnabled: boolean;
  isFromDb: boolean;
}

async function getSmtpFromDb(): Promise<Partial<SmtpSettingsResponse> & { isFromDb: boolean }> {
  const rows = await prisma.siteSettings.findMany({
    where: { key: { in: [...SMTP_KEYS] } },
  });

  if (rows.length === 0) return { isFromDb: false };

  const map = Object.fromEntries(rows.map((r) => [r.key, r.valueFr ?? '']));

  return {
    host: map['smtp_host'] || undefined,
    port: map['smtp_port'] ? parseInt(map['smtp_port']) : undefined,
    user: map['smtp_user'] || undefined,
    password: map['smtp_password'] || undefined,
    from: map['smtp_from'] || undefined,
    secure: map['smtp_secure'] === 'true',
    alertEmailTo: map['smtp_alert_email_to'] || undefined,
    bccAdminEnabled: map['smtp_bcc_admin_enabled'] === 'true',
    isFromDb: true,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const dbSettings = await getSmtpFromDb();

    const merged: SmtpSettingsResponse = {
      host: dbSettings.host ?? process.env.SMTP_HOST ?? '',
      port: dbSettings.port ?? parseInt(process.env.SMTP_PORT ?? '587'),
      user: dbSettings.user ?? process.env.SMTP_USER ?? '',
      password: dbSettings.password ?? process.env.SMTP_PASSWORD ?? '',
      from: dbSettings.from ?? process.env.SMTP_FROM ?? '',
      secure: dbSettings.secure ?? process.env.SMTP_SECURE === 'true',
      alertEmailTo: dbSettings.alertEmailTo ?? process.env.ALERT_EMAIL_TO ?? '',
      bccAdminEnabled: dbSettings.bccAdminEnabled ?? false,
      isFromDb: dbSettings.isFromDb,
    };

    return NextResponse.json(merged);
  } catch (error) {
    console.error('SMTP settings GET error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const patch = smtpSchema.parse(body);

    const upserts: Promise<unknown>[] = [];

    const fieldToKey: Record<string, string> = {
      host: 'smtp_host',
      port: 'smtp_port',
      user: 'smtp_user',
      password: 'smtp_password',
      from: 'smtp_from',
      secure: 'smtp_secure',
      alertEmailTo: 'smtp_alert_email_to',
      bccAdminEnabled: 'smtp_bcc_admin_enabled',
    };

    for (const [field, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      const key = fieldToKey[field];
      if (!key) continue;

      const stringValue = String(value);
      upserts.push(
        prisma.siteSettings.upsert({
          where: { key },
          create: {
            key,
            valueFr: stringValue,
            description: `SMTP setting: ${field}`,
            updatedBy: session.user.id,
          },
          update: {
            valueFr: stringValue,
            updatedBy: session.user.id,
          },
        })
      );
    }

    await Promise.all(upserts);

    await emailService.reload();

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'admin.smtp_settings_updated',
        details: {
          updatedFields: Object.keys(patch).filter((k) => patch[k as keyof typeof patch] !== undefined),
          severity: 'medium',
          timestamp: new Date().toISOString(),
        },
        ipAddress:
          request.headers.get('x-forwarded-for') ??
          request.headers.get('x-real-ip') ??
          'unknown',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    console.error('SMTP settings PATCH error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await prisma.siteSettings.deleteMany({
      where: { key: { in: [...SMTP_KEYS] } },
    });

    await emailService.reload();

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'admin.smtp_settings_reset',
        details: {
          message: 'SMTP settings reset to .env fallback',
          severity: 'medium',
          timestamp: new Date().toISOString(),
        },
        ipAddress:
          request.headers.get('x-forwarded-for') ??
          request.headers.get('x-real-ip') ??
          'unknown',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SMTP settings DELETE error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
