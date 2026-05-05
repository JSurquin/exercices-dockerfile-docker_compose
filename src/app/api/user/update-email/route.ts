import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { z } from 'zod';
import { applyRateLimit, RateLimiter } from '@/lib/security/rate-limiter';

const schema = z
  .object({
    email: z
      .string()
      .email('Adresse email invalide')
      .max(254, 'Adresse email trop longue')
      .transform((v) => v.toLowerCase().trim()),
  })
  .strip();

// 5 changements d'email par heure par utilisateur/IP
const emailUpdateLimiter = new RateLimiter('email_update', {
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Rate limiting par utilisateur + IP
    const rateLimitResponse = await emailUpdateLimiter.checkLimit(request, session.user.id);
    if (!rateLimitResponse.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez dans une heure.' },
        { status: 429 }
      );
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
    }

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Données invalides' },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Vérifier si l'email est déjà utilisé comme contactEmail par un autre utilisateur
    const existing = await prisma.user.findFirst({
      where: { contactEmail: email, NOT: { id: session.user.id } },
      select: { id: true },
    });

    if (existing) {
      // Réponse volontairement générique pour éviter l'énumération d'emails
      return NextResponse.json({ error: 'Cette adresse email est déjà utilisée' }, { status: 409 });
    }

    // On met à jour contactEmail — jamais user.email qui est la clé d'auth interne Steam
    await prisma.user.update({
      where: { id: session.user.id },
      data: { contactEmail: email },
    });

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'user.email_updated',
        details: {
          severity: 'medium',
          timestamp: new Date().toISOString(),
        },
        ipAddress: ip,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('update-email error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
