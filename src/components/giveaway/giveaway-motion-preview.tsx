'use client';

import { useState } from 'react';
import { GiveawayPageReveal } from '@/components/giveaway/giveaway-motion-surface';
import { GiveawayRecurringCarousel } from '@/components/giveaway/giveaway-recurring-carousel';
import { GiveawayStarfield } from '@/components/giveaway/giveaway-starfield';
import { useLocale } from '@/components/providers/locale-provider';
import type { GiveawayWithEntries } from '@/hooks/use-giveaways';

function mockGiveaway(
  overrides: Partial<GiveawayWithEntries> & Pick<GiveawayWithEntries, 'id' | 'prize' | 'durationType'>
): GiveawayWithEntries {
  const now = Date.now();
  return {
    title: overrides.prize,
    description: '',
    ticketPrice: 25,
    maxTickets: 500,
    soldTickets: 80,
    endDate: new Date(now + 6 * 60 * 60 * 1000).toISOString(),
    status: 'ACTIVE',
    startDate: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    rewardValueCents: 18900,
    totalParticipants: 42,
    totalEntries: 80,
    myEntries: 3,
    myChancePercent: 3.75,
    ...overrides,
  };
}

const PREVIEW_GIVEAWAYS: GiveawayWithEntries[] = [
  mockGiveaway({
    id: 'preview-daily',
    prize: 'AK-47 | Redline (Field-Tested)',
    steamMarketHashName: 'AK-47 | Redline (Field-Tested)',
    durationType: 'DAILY',
    ticketPrice: 10,
    rewardValueCents: 1850,
    endDate: new Date(Date.now() + 50 * 60 * 1000).toISOString(),
  }),
  mockGiveaway({
    id: 'preview-weekly',
    prize: 'AWP | Asiimov (Field-Tested)',
    steamMarketHashName: 'AWP | Asiimov (Field-Tested)',
    durationType: 'WEEKLY',
    ticketPrice: 25,
    rewardValueCents: 8900,
  }),
  mockGiveaway({
    id: 'preview-yearly',
    prize: '★ Karambit | Fade (Factory New)',
    steamMarketHashName: '★ Karambit | Fade (Factory New)',
    durationType: 'YEARLY',
    ticketPrice: 80,
    rewardValueCents: 189000,
    endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
  }),
];

export function GiveawayMotionPreview() {
  const { messages } = useLocale();
  const [index, setIndex] = useState(1);
  const [fragments, setFragments] = useState(240);
  const [giveaways, setGiveaways] = useState(PREVIEW_GIVEAWAYS);

  return (
    <div className="container relative mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <GiveawayStarfield />
      <GiveawayPageReveal index={0} className="relative z-[1]">
        <GiveawayRecurringCarousel
          giveaways={giveaways}
          messages={messages}
          userFragments={fragments}
          activeIndex={index}
          onActiveIndexChange={setIndex}
          onParticipate={async (giveaway, entries) => {
            setFragments((current) => Math.max(0, current - entries * giveaway.ticketPrice));
            setGiveaways((current) =>
              current.map((item) => {
                if (item.id !== giveaway.id) return item;
                const myEntries = (item.myEntries ?? 0) + entries;
                const totalEntries = (item.totalEntries ?? item.soldTickets) + entries;
                return {
                  ...item,
                  myEntries,
                  totalEntries,
                  soldTickets: item.soldTickets + entries,
                  myChancePercent: totalEntries > 0 ? (100 * myEntries) / totalEntries : 0,
                };
              })
            );
          }}
        />
      </GiveawayPageReveal>
    </div>
  );
}
