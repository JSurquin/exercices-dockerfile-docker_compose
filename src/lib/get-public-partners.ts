import { cache } from 'react';
import { prisma } from '~/prisma/prisma';

export type PublicPartnerVideo = {
  id: string;
  youtubeVideoId: string;
  youtubeVideoUrl: string;
  creatorName: string;
  subscriberCount: string | null;
  avatarUrl: string | null;
  youtubeChannelUrl: string | null;
  twitterUrl: string | null;
};

export type PublicPartnerLogo = {
  id: string;
  name: string;
  logoUrl: string;
  profileUrl: string | null;
};

export type PublicPartnersResponse = {
  videos: PublicPartnerVideo[];
  logos: PublicPartnerLogo[];
};

export const EMPTY_PUBLIC_PARTNERS: PublicPartnersResponse = {
  videos: [],
  logos: [],
};

export async function getPublicPartners(): Promise<PublicPartnersResponse> {
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

  return { videos, logos };
}

export const getServerPublicPartners = cache(getPublicPartners);
