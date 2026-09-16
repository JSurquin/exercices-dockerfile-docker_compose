'use client';

import { Badge } from '@/components/ui/badge';
import { SafeImage } from '@/components/ui/safe-image';
import { usePartnerLogos } from '@/hooks/use-partner-logos';
import { findPartnerLogo, formatCommunityName } from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';
import { Handshake } from 'lucide-react';
import type { Messages } from '~/utils/types';

export function partnerBadgeLabel(
  giveaway: { isPrivate?: boolean; requiredAffiliateCode?: string | null },
  messages: Messages
): string | null {
  if (!giveaway.isPrivate) return null;
  const name = formatCommunityName(giveaway.requiredAffiliateCode ?? '');
  if (!name) return messages.giveaways.card.privateLabel;
  return messages.giveaways.card.partnerBadge.replace('{name}', name);
}

export function GiveawayPartnerBadge({
  giveaway,
  messages,
  className,
}: {
  giveaway: { isPrivate?: boolean; requiredAffiliateCode?: string | null };
  messages: Messages;
  className?: string;
}) {
  const { data: logos = [] } = usePartnerLogos();
  const label = partnerBadgeLabel(giveaway, messages);
  if (!label) return null;
  const logo = findPartnerLogo(giveaway.requiredAffiliateCode, logos);

  return (
    <Badge
      variant="outline"
      data-tier="partenaire"
      className={cn(
        'giveaway-partner-badge giveaway-tier-badge flex max-w-full items-center gap-1 text-xs font-normal',
        className
      )}
    >
      {logo ? (
        <SafeImage
          src={logo.logoUrl}
          alt=""
          width={14}
          height={14}
          className="h-3.5 w-3.5 shrink-0 rounded-sm object-cover"
          fallbackClassName="hidden"
          unoptimized
        />
      ) : (
        <Handshake className="h-3 w-3 shrink-0" aria-hidden />
      )}
      <span className="truncate">{label}</span>
    </Badge>
  );
}
