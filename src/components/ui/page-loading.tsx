'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { cn } from '@/lib/utils';

type PageLoadingProps = {
  variant?: 'full' | 'compact';
  message?: string;
  className?: string;
};

/** Viseur chrome — couleurs en dur, visible sur tous les thèmes */
function CrosshairSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'sm' ? 'size-10' : size === 'lg' ? 'size-20' : 'size-14';
  const arm = size === 'sm' ? 'w-5 h-0.5' : size === 'lg' ? 'w-10 h-0.5' : 'w-7 h-0.5';
  const armV = size === 'sm' ? 'w-0.5 h-5' : size === 'lg' ? 'w-0.5 h-10' : 'w-0.5 h-7';

  return (
    <div className={cn('relative shrink-0', box)} aria-hidden>
      <div className="absolute inset-0 rounded-full border-2 border-[#7eb3e8]/40 animate-pulse" />
      <div className="absolute inset-0 animate-spin">
        <span
          className={cn(
            'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7eb3e8]',
            arm
          )}
        />
        <span
          className={cn(
            'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7eb3e8]',
            armV
          )}
        />
      </div>
      <span className="absolute left-1/2 top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#a8c8e8]" />
    </div>
  );
}

function ProgressTrack({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        'h-1.5 overflow-hidden rounded-full bg-[#ffffff14]',
        compact ? 'w-36 max-w-full' : 'w-52 max-w-full'
      )}
      aria-hidden
    >
      <div className="h-full w-2/5 animate-pulse rounded-full bg-gradient-to-r from-[#3d6a9e] to-[#7eb3e8]" />
    </div>
  );
}

export function PageLoading({ variant = 'full', message, className }: PageLoadingProps) {
  const { messages } = useLocale();
  const title = message ?? messages.loading.title;
  const subtitle = messages.loading.subtitle;

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-4 py-10',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <CrosshairSpinner size="sm" />
        <p className="text-sm font-medium text-foreground">{title}</p>
        <ProgressTrack compact />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className="relative overflow-hidden rounded-2xl px-8 py-6 shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #3d6a9e, #7eb3e8)' }}
      >
        <div className="text-3xl font-bold tracking-wider text-white">
          Moon<span className="text-yellow-300">Skin</span>
        </div>
      </div>

      <CrosshairSpinner size="lg" />

      <div className="space-y-2 text-center">
        <p className="text-xl font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <ProgressTrack />

      <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        {[messages.loading.steam, messages.loading.inventory, messages.loading.skins].map(
          (label) => (
            <li key={label} className="flex items-center gap-2">
              <span className="size-2 shrink-0 rounded-full bg-[#7eb3e8]" aria-hidden />
              {label}
            </li>
          )
        )}
      </ul>
    </div>
  );
}
