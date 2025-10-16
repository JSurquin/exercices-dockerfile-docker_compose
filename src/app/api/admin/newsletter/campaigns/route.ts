import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

const createCampaignSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  subject: z.string().min(1, 'Sujet requis'),
  content: z.string().min(1, 'Contenu requis'),
  htmlContent: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Accès non autorisé.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    // Récupérer les campagnes avec pagination
    const [campaigns, total] = await Promise.all([
      prisma.newsletterCampaign.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          subject: true,
          status: true,
          scheduledAt: true,
          sentAt: true,
          createdAt: true,
          _count: {
            select: {
              sends: true,
            },
          },
        },
      }),
      prisma.newsletterCampaign.count(),
    ]);

    return NextResponse.json({
      campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get newsletter campaigns error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Une erreur interne est survenue.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Accès non autorisé.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createCampaignSchema.parse(body);

    // Créer la campagne
    const campaign = await prisma.newsletterCampaign.create({
      data: {
        ...validatedData,
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
        createdBy: session.user.id,
        status: validatedData.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      },
    });

    console.log(`Nouvelle campagne newsletter créée: ${campaign.id}`);

    return NextResponse.json({
      success: true,
      campaign,
    });

  } catch (error) {
    console.error('Create newsletter campaign error:', error);

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