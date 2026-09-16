import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import type { GiveawayTier } from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';

export function GiveawayTierBadge({
  tier,
  children,
  className,
}: {
  tier: GiveawayTier;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      data-tier={tier}
      className={cn('giveaway-tier-badge shrink-0 font-normal', className)}
      style={{
        background: 'var(--giveaway-tier-bg)',
        color: 'var(--giveaway-tier-fg)',
        borderColor: 'var(--giveaway-tier-border)',
      }}
    >
      {children}
    </Badge>
  );
}
