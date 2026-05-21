import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

const logoPatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  logoUrl: z.string().min(1).max(2048).optional(),
  profileUrl: z.string().max(2048).optional().nullable().or(z.literal('')),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

function normalizeOptionalUrl(value: string | null | undefined): string | null {
  if (!value || value.trim() === '') return null;
  return value.trim();
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = logoPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = { ...parsed.data };
    if ('profileUrl' in parsed.data) {
      data.profileUrl = normalizeOptionalUrl(parsed.data.profileUrl ?? null);
    }

    const logo = await prisma.partnerLogo.update({
      where: { id },
      data,
    });

    return NextResponse.json({ logo });
  } catch (error) {
    console.error('[admin partners logos PATCH]', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.partnerLogo.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin partners logos DELETE]', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
