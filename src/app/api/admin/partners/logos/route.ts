import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

const logoBodySchema = z.object({
  name: z.string().min(1).max(120),
  logoUrl: z.string().min(1).max(2048),
  profileUrl: z.string().max(2048).optional().nullable().or(z.literal('')),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

function normalizeOptionalUrl(value: string | null | undefined): string | null {
  if (!value || value.trim() === '') return null;
  return value.trim();
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const logos = await prisma.partnerLogo.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ logos });
  } catch (error) {
    console.error('[admin partners logos GET]', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = logoBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const logo = await prisma.partnerLogo.create({
      data: {
        name: parsed.data.name,
        logoUrl: parsed.data.logoUrl,
        profileUrl: normalizeOptionalUrl(parsed.data.profileUrl ?? null),
        sortOrder: parsed.data.sortOrder ?? 0,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json({ logo }, { status: 201 });
  } catch (error) {
    console.error('[admin partners logos POST]', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
