import { NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';

export async function GET() {
  try {
    const [videos, logos] = await Promise.all([
      prisma.partnerVideo.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          youtubeVideoId: true,
          youtubeVideoUrl: true,
          creatorName: true,
          subscriberCount: true,
          avatarUrl: true,
          youtubeChannelUrl: true,
          twitterUrl: true,
        },
      }),
      prisma.partnerLogo.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          name: true,
          logoUrl: true,
          profileUrl: true,
        },
      }),
    ]);

    return NextResponse.json(
      { videos, logos },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[partners GET]', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
