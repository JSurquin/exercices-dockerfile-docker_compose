'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getDisplayInitials, resolveAvatarSrc } from '@/lib/giveaway-presentation';
import { cn } from '@/lib/utils';

export function GiveawayUserAvatar({
  name,
  avatar,
  className,
  fallbackName,
}: {
  name: string | null | undefined;
  avatar: string | null | undefined;
  className?: string;
  fallbackName: string;
}) {
  const displayName = (name ?? '').trim() || fallbackName;
  const initials = getDisplayInitials(displayName) || getDisplayInitials(fallbackName) || 'MS';
  const src = resolveAvatarSrc(avatar);

  return (
    <Avatar className={cn('h-8 w-8', className)}>
      <AvatarImage src={src} alt={displayName} referrerPolicy="no-referrer" />
      <AvatarFallback delayMs={0} className="text-[10px] font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
