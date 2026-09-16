import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { getGiveawayTierTokens, type GiveawayTier } from '@/lib/giveaway-presentation';
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
  const tokens = getGiveawayTierTokens(tier);
  return (
    <Badge
      variant="outline"
      data-tier={tier}
      className={cn('giveaway-tier-badge shrink-0 font-normal text-[color:var(--giveaway-tier-fg)]', className)}
      style={{
        background: tokens.bg,
        color: tokens.fg,
        borderColor: tokens.border,
        ['--giveaway-tier-bg' as string]: tokens.bg,
        ['--giveaway-tier-fg' as string]: tokens.fg,
        ['--giveaway-tier-border' as string]: tokens.border,
      }}
    >
      {children}
    </Badge>
  );
}
