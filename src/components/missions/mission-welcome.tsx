'use client';

import { Button } from '@/components/ui/button';
import { GiftIcon } from '@heroicons/react/24/outline';
import { FragmentAmount } from '@/components/ui/level-badge';
import type { MissionRow } from '@/lib/mission-presentation';
import type { Messages } from '~/utils/types';

export function MissionWelcomeBanner({
  mission,
  onClaim,
  isPending,
  t,
}: {
  mission: MissionRow;
  onClaim: (key: string) => void;
  isPending: boolean;
  t: Messages['missions'];
}) {
  const item = t.items.WELCOME_BONUS;

  return (
    <div className="mission-welcome lunar-card px-4 py-4 sm:px-6 sm:py-5">
      <div className="relative z-[1] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-theme-accent/30 bg-theme-accent/15">
            <GiftIcon className="h-6 w-6 text-theme-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-theme-accent">
              {t.welcomeBadge}
            </p>
            <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
              {item.label}
            </h2>
            <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{item.description}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end">
          <FragmentAmount
            amount={mission.rewardFragments}
            prefix="+"
            size="sm"
            className="text-2xl font-bold text-theme-accent"
          />
          <Button
            size="lg"
            variant="cta"
            disabled={isPending || !mission.eligible}
            onClick={() => onClaim(mission.key)}
            className="min-w-[9.5rem]"
          >
            <GiftIcon className="h-4 w-4" />
            {t.claim}
          </Button>
        </div>
      </div>
    </div>
  );
}
