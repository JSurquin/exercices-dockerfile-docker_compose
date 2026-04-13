import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { newsletterService } from '@/lib/newsletter-service';
import { z } from 'zod';


const subscribeSchema = z.object({
  email: z.string().email('Adresse email invalide'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = subscribeSchema.parse(body);

    // Normaliser l'email (minuscules)
    const normalizedEmail = email.toLowerCase().trim();

    // Vérifier si l'email existe déjà
    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return NextResponse.json(
          { error: 'ALREADY_SUBSCRIBED', message: 'Cette adresse email est déjà abonnée.' },
          { status: 400 }
        );
      } else {
        // Réactiver l'abonnement si il était désactivé
        await prisma.newsletterSubscriber.update({
          where: { email: normalizedEmail },
          data: {
            isActive: true,
            subscribedAt: new Date(),
            unsubscribedAt: null,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Abonnement réactivé avec succès.',
        });
      }
    }

    // Créer un nouvel abonné
    const subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email: normalizedEmail,
        isActive: true,
      },
    });

    // Envoyer l'email de bienvenue (en arrière-plan)
    try {
      await newsletterService.sendWelcomeEmail(
        subscriber.email,
        subscriber.unsubscribeToken
      );
    } catch (emailError) {
      // Ne pas faire échouer l'inscription si l'email de bienvenue échoue
      console.error('Erreur envoi email de bienvenue:', emailError);
    }

    // Log de l'inscription (optionnel, pour audit)
    console.log(`Nouvelle inscription newsletter: ${normalizedEmail}`);

    return NextResponse.json({
      success: true,
      message: 'Inscription réussie.',
      subscriberId: subscriber.id,
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);

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