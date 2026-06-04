'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { cn } from '@/lib/utils';

type PageLoadingProps = {
  /** full = écran route (logo + crosshair + barre) ; compact = zones inline */
  variant?: 'full' | 'compact';
  message?: string;
  className?: string;
};

function CrosshairLoader({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <div
      className={cn(
        'page-loader-crosshair',
        size === 'sm' && 'page-loader-crosshair--sm'
      )}
      role="status"
      aria-label="Loading"
    >
      <div className="page-loader-crosshair__ring" />
      <div className="page-loader-crosshair__spin">
        <span className="page-loader-crosshair__arm-h" />
        <span className="page-loader-crosshair__arm-v" />
        <span className="page-loader-crosshair__dot page-loader-crosshair__dot--t" />
        <span className="page-loader-crosshair__dot page-loader-crosshair__dot--b" />
        <span className="page-loader-crosshair__dot page-loader-crosshair__dot--l" />
        <span className="page-loader-crosshair__dot page-loader-crosshair__dot--r" />
      </div>
      <span className="page-loader-crosshair__dot page-loader-crosshair__dot--c" />
    </div>
  );
}

function ProgressBar({ compact }: { compact?: boolean }) {
  return (
    <div className={cn('page-loader-bar', compact && 'page-loader-bar--sm')}>
      <span className="page-loader-bar__fill" />
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
          'page-loader flex flex-col items-center justify-center gap-4 py-8',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <CrosshairLoader size="sm" />
        <p className="page-loader-text text-sm">{title}</p>
        <ProgressBar compact />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'page-loader min-h-screen flex items-center justify-center bg-background px-6',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="page-loader-logo">
          <div className="page-loader-logo__shine" aria-hidden />
          <div className="relative text-3xl font-bold tracking-wider text-white">
            Moon<span className="text-yellow-300">Skin</span>
          </div>
        </div>

        <CrosshairLoader />

        <div className="space-y-2">
          <p className="page-loader-text">{title}</p>
          <p className="page-loader-subtext">{subtitle}</p>
        </div>

        <ProgressBar />

        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {[messages.loading.steam, messages.loading.inventory, messages.loading.skins].map(
            (label) => (
              <li key={label} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: '#7eb3e8' }}
                  aria-hidden
                />
                {label}
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
}
