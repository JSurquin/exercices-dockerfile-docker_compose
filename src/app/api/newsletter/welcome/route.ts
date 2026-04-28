import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { newsletterService } from '@/lib/newsletter-service';
import { applyRateLimit } from '@/lib/security/rate-limiter';
import { z } from 'zod';


const welcomeEmailSchema = z.object({
  email: z.string().email('Adresse email invalide'),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'newsletterResendWelcome');
    if (rateLimited) {
      return rateLimited;
    }

    const body = await request.json();
    const { email } = welcomeEmailSchema.parse(body);

    const normalizedEmail = email.toLowerCase().trim();

    // Vérifier que l'abonné existe et est actif
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (!subscriber || !subscriber.isActive) {
      return NextResponse.json(
        { error: 'SUBSCRIBER_NOT_FOUND', message: 'Abonné introuvable ou inactif.' },
        { status: 404 }
      );
    }

    // Envoyer l'email de bienvenue
    const result = await newsletterService.sendWelcomeEmail(
      subscriber.email,
      subscriber.unsubscribeToken
    );

    if (result.success) {
      console.log(`Email de bienvenue envoyé à: ${subscriber.email}`);
      
      return NextResponse.json({
        success: true,
        message: 'Email de bienvenue envoyé avec succès.',
      });
    } else {
      return NextResponse.json(
        { error: 'SEND_ERROR', message: 'Erreur lors de l\'envoi de l\'email.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Send welcome email error:', error);

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