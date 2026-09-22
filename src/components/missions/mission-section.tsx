'use client';

import type { ReactNode } from 'react';
import { formatClaimableBadge, formatSectionAllDone } from '@/lib/mission-presentation';
import type { Messages } from '~/utils/types';

export function MissionSection({
  title,
  resetLabel,
  claimable,
  allClaimed,
  tourTarget,
  children,
  t,
}: {
  title: string;
  resetLabel: string;
  claimable: number;
  allClaimed: boolean;
  tourTarget?: boolean;
  children: ReactNode;
  t: Messages['missions'];
}) {
  const badge = formatClaimableBadge(t.claimableBadge, claimable);
  const meta = allClaimed ? formatSectionAllDone(t.sectionAllDone, resetLabel) : resetLabel;

  return (
    <section className="mission-section" data-tour={tourTarget ? 'missions-categories' : undefined}>
      <div className="mission-section__head">
        <div className="mission-section__head-main">
          <h2 className="mission-section__title">{title}</h2>
          <p className="mission-section__meta" data-countdown>
            {meta}
          </p>
        </div>
        {badge ? <span className="mission-section__badge">{badge}</span> : null}
      </div>
      {children}
    </section>
  );
}
