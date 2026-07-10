import { cache } from 'react';
import { prisma } from '~/prisma/prisma';

export type PublicHomePopup = {
  id: string;
  titleFr: string;
  titleEn: string;
  titleCn: string | null;
  messageFr: string;
  messageEn: string;
  messageCn: string | null;
  ctaUrl: string | null;
  ctaLabelFr: string | null;
  ctaLabelEn: string | null;
  ctaLabelCn: string | null;
  priority: number;
};

export const EMPTY_PUBLIC_HOME_POPUPS: PublicHomePopup[] = [];

const publicHomePopupSelect = {
  id: true,
  titleFr: true,
  titleEn: true,
  titleCn: true,
  messageFr: true,
  messageEn: true,
  messageCn: true,
  ctaUrl: true,
  ctaLabelFr: true,
  ctaLabelEn: true,
  ctaLabelCn: true,
  priority: true,
} as const;

export function isHomePopupWithinSchedule(
  popup: { startsAt: Date | null; endsAt: Date | null },
  now: Date = new Date()
): boolean {
  if (popup.startsAt && popup.startsAt > now) return false;
  if (popup.endsAt && popup.endsAt < now) return false;
  return true;
}

export async function getActiveHomePopups(now: Date = new Date()): Promise<PublicHomePopup[]> {
  return prisma.homePopup.findMany({
    where: {
      status: 'ACTIVE',
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    select: publicHomePopupSelect,
  });
}

export const getServerActiveHomePopups = cache(getActiveHomePopups);
