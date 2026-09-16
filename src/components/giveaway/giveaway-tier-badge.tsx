import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import type { GiveawayVisualTier } from '@/lib/giveaway-presentation';
import { giveawayVisualTierAttr } from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';

export function GiveawayTierBadge({
  tier,
  children,
  className,
}: {
  tier: GiveawayVisualTier;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      data-tier={giveawayVisualTierAttr(tier)}
      className={cn('giveaway-tier-badge shrink-0 font-normal', className)}
    >
      {children}
    </Badge>
  );
}
