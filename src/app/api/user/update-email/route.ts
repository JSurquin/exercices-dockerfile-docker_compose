import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Adresse email invalide'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { email } = schema.parse(body);

    // Vérifier si l'email est déjà utilisé comme contactEmail par un autre utilisateur
    const existing = await prisma.user.findFirst({
      where: { contactEmail: email, NOT: { id: session.user.id } },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ error: 'Cette adresse email est déjà utilisée' }, { status: 409 });
    }

    // On met à jour contactEmail — jamais user.email qui est la clé d'auth interne Steam
    await prisma.user.update({
      where: { id: session.user.id },
      data: { contactEmail: email },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'user.email_updated',
        details: {
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
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Données invalides' }, { status: 400 });
    }
    console.error('update-email error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
