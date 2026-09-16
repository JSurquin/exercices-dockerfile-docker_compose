'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getDisplayInitials } from '@/lib/giveaway-presentation';
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

  return (
    <Avatar className={cn('h-8 w-8', className)}>
      <AvatarImage src={avatar || undefined} alt={displayName} />
      <AvatarFallback className="text-[10px] font-semibold">{initials}</AvatarFallback>
    </Avatar>
  );
}
