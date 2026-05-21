import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { extractYoutubeVideoId, getYoutubeWatchUrl } from '@/lib/youtube';

const videoPatchSchema = z.object({
  youtubeVideoUrl: z.string().min(1).optional(),
  creatorName: z.string().min(1).max(120).optional(),
  subscriberCount: z.string().max(32).optional().nullable(),
  avatarUrl: z.string().max(2048).optional().nullable().or(z.literal('')),
  youtubeChannelUrl: z.string().max(2048).optional().nullable().or(z.literal('')),
  twitterUrl: z.string().max(2048).optional().nullable().or(z.literal('')),
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
    const parsed = videoPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.youtubeVideoUrl) {
      const videoId = extractYoutubeVideoId(parsed.data.youtubeVideoUrl);
      if (!videoId) {
        return NextResponse.json({ error: 'URL YouTube invalide' }, { status: 400 });
      }
      data.youtubeVideoId = videoId;
      data.youtubeVideoUrl = getYoutubeWatchUrl(videoId);
    }
    if ('avatarUrl' in parsed.data) {
      data.avatarUrl = normalizeOptionalUrl(parsed.data.avatarUrl ?? null);
    }
    if ('youtubeChannelUrl' in parsed.data) {
      data.youtubeChannelUrl = normalizeOptionalUrl(parsed.data.youtubeChannelUrl ?? null);
    }
    if ('twitterUrl' in parsed.data) {
      data.twitterUrl = normalizeOptionalUrl(parsed.data.twitterUrl ?? null);
    }

    const video = await prisma.partnerVideo.update({
      where: { id },
      data,
    });

    return NextResponse.json({ video });
  } catch (error) {
    console.error('[admin partners videos PATCH]', error);
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
    await prisma.partnerVideo.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin partners videos DELETE]', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
