import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '~/prisma/prisma';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { extractYoutubeVideoId, getYoutubeWatchUrl } from '@/lib/youtube';

const videoBodySchema = z.object({
  youtubeVideoUrl: z.string().min(1),
  creatorName: z.string().min(1).max(120),
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

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const videos = await prisma.partnerVideo.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ videos });
  } catch (error) {
    console.error('[admin partners videos GET]', error);
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
    const parsed = videoBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const videoId = extractYoutubeVideoId(parsed.data.youtubeVideoUrl);
    if (!videoId) {
      return NextResponse.json({ error: 'URL YouTube invalide' }, { status: 400 });
    }

    const video = await prisma.partnerVideo.create({
      data: {
        youtubeVideoUrl: getYoutubeWatchUrl(videoId),
        youtubeVideoId: videoId,
        creatorName: parsed.data.creatorName,
        subscriberCount: parsed.data.subscriberCount ?? null,
        avatarUrl: normalizeOptionalUrl(parsed.data.avatarUrl ?? null),
        youtubeChannelUrl: normalizeOptionalUrl(parsed.data.youtubeChannelUrl ?? null),
        twitterUrl: normalizeOptionalUrl(parsed.data.twitterUrl ?? null),
        sortOrder: parsed.data.sortOrder ?? 0,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error('[admin partners videos POST]', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
