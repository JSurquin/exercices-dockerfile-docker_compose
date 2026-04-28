import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { applyRateLimit } from '@/lib/security/rate-limiter';
import { maskEmailForClientResponse } from '@/lib/newsletter-privacy';
import { z } from 'zod';


const unsubscribeSchema = z.object({
  token: z.string().min(1, 'Token requis'),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'newsletterUnsubscribe');
    if (rateLimited) {
      return rateLimited;
    }

    const body = await request.json();
    const { token } = unsubscribeSchema.parse(body);

    // Trouver l'abonné avec ce token
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN', message: 'Token de désabonnement invalide.' },
        { status: 400 }
      );
    }

    if (!subscriber.isActive) {
      return NextResponse.json(
        { error: 'ALREADY_UNSUBSCRIBED', message: 'Vous êtes déjà désabonné.' },
        { status: 400 }
      );
    }

    // Désactiver l'abonnement
    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
      },
    });

    console.log(`Désabonnement newsletter: ${subscriber.email}`);

    return NextResponse.json({
      success: true,
      message: 'Désabonnement réussi.',
      email: maskEmailForClientResponse(subscriber.email),
    });

  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Une erreur interne est survenue.' },
      { status: 500 }
    );
  }
}

// Gestion du désabonnement via GET (lien dans l'email)
export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'newsletterUnsubscribe');
    if (rateLimited) {
      return rateLimited;
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'TOKEN_REQUIRED', message: 'Token requis.' },
        { status: 400 }
      );
    }

    // Trouver l'abonné avec ce token
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN', message: 'Token de désabonnement invalide.' },
        { status: 400 }
      );
    }

    if (!subscriber.isActive) {
      return NextResponse.json({
        success: true,
        message: 'Vous êtes déjà désabonné.',
        email: maskEmailForClientResponse(subscriber.email),
      });
    }

    // Désactiver l'abonnement
    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
      },
    });

    console.log(`Désabonnement newsletter (GET): ${subscriber.email}`);

    return NextResponse.json({
      success: true,
      message: 'Désabonnement réussi.',
      email: maskEmailForClientResponse(subscriber.email),
    });

  } catch (error) {
    console.error('Newsletter unsubscribe (GET) error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Une erreur interne est survenue.' },
      { status: 500 }
    );
  }
}