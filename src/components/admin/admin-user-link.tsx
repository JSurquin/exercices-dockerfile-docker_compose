'use client';

import Link from 'next/link';
import { User } from 'lucide-react';
import { SafeImg } from '@/components/ui/safe-image';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { truncateAuditUserId } from '@/lib/admin/audit-log-display';

type AdminUserLinkProps = {
  userId: string;
  name?: string | null;
  avatar?: string | null;
  email?: string | null;
  subtitle?: string | null;
  showEmail?: boolean;
  showUserId?: boolean;
  avatarSize?: 'sm' | 'md';
  className?: string;
};

export function AdminUserLink({
  userId,
  name,
  avatar,
  email,
  subtitle,
  showEmail = false,
  showUserId = false,
  avatarSize = 'md',
  className,
}: AdminUserLinkProps) {
  const displayName = name || email || truncateAuditUserId(userId, 12);
  const avatarClass = avatarSize === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  const avatarSrc = avatar?.trim() || undefined;
  const truncatedId = truncateAuditUserId(userId);

  return (
    <Link
      href={`/admin/users/${userId}`}
      className={cn(
        'group flex items-center gap-2 min-w-0 rounded-md transition-colors hover:bg-slate-700/30 -m-1 p-1',
        className,
      )}
    >
      <SafeImg
        src={avatarSrc}
        alt={displayName}
        className={cn(avatarClass, 'shrink-0 rounded-full object-cover')}
        fallbackClassName={cn(avatarClass, 'shrink-0 rounded-full bg-slate-600 text-slate-300')}
        fallbackIcon={<User className={avatarSize === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
      />
      <div className="min-w-0">
        <div className="font-medium text-white truncate group-hover:text-theme-highlight transition-colors">
          {displayName}
        </div>
        {showEmail && email && (
          <div className="text-xs text-slate-400 truncate">{email}</div>
        )}
        {subtitle && (
          <div className="text-xs text-slate-500 truncate">{subtitle}</div>
        )}
        {showUserId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="text-xs text-slate-500 font-mono truncate max-w-[120px] cursor-help w-fit"
                onClick={(e) => e.stopPropagation()}
              >
                {truncatedId}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="font-mono text-xs max-w-none">
              {userId}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </Link>
  );
}
