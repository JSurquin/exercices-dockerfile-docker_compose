import { Crown, Store, UserCheck } from 'lucide-react';

type UserRoleBadgeProps = {
  role?: string;
  userTag?: string | null;
  size?: 'xs' | 'sm';
};

const TAG_CONFIG: Record<string, { className: string; icon: typeof Crown }> = {
  VIP: {
    className: 'bg-amber-500/20 border border-amber-500/40 text-amber-400',
    icon: Crown,
  },
  MERCHANT: {
    className: 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400',
    icon: Store,
  },
};

const ROLE_CONFIG: Record<string, { className: string; icon: typeof UserCheck; label: string }> = {
  AFFILIATE: {
    className: 'bg-purple-500/20 border border-purple-500/40 text-purple-400',
    icon: UserCheck,
    label: 'Affilié',
  },
};

export function UserRoleBadge({ role, userTag, size = 'xs' }: UserRoleBadgeProps) {
  const badges: React.ReactNode[] = [];

  if (role && ROLE_CONFIG[role]) {
    const cfg = ROLE_CONFIG[role];
    const Icon = cfg.icon;
    badges.push(
      <span
        key={`role-${role}`}
        className={`inline-flex items-center gap-1 rounded-full font-semibold leading-none ${cfg.className} ${
          size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
        }`}
      >
        <Icon className={size === 'xs' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
        {cfg.label}
      </span>
    );
  }

  if (userTag && TAG_CONFIG[userTag]) {
    const cfg = TAG_CONFIG[userTag];
    const Icon = cfg.icon;
    badges.push(
      <span
        key={`tag-${userTag}`}
        className={`inline-flex items-center gap-1 rounded-full font-semibold leading-none ${cfg.className} ${
          size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
        }`}
      >
        <Icon className={size === 'xs' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
        {userTag}
      </span>
    );
  }

  if (badges.length === 0) return null;

  return <>{badges}</>;
}
