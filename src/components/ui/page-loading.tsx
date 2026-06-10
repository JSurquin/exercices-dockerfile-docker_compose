'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { cn } from '@/lib/utils';

type PageLoadingProps = {
  /** @deprecated Utiliser compact, même rendu minimal */
  variant?: 'full' | 'compact';
  message?: string;
  className?: string;
};

function MoonSkinMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'font-bold tracking-wider text-chrome-gradient select-none',
        className
      )}
      aria-hidden
    >
      MoonSkin
    </span>
  );
}

/**
 * Loader minimal pour pages gated / chargement de données.
 * Pas de splash plein écran, la home et le marketing n’utilisent pas ce composant.
 */
export function PageLoading({ variant = 'compact', message, className }: PageLoadingProps) {
  const { messages } = useLocale();
  const label = message ?? messages.common.loading;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6',
        variant === 'full' ? 'min-h-screen' : 'py-10',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <MoonSkinMark className="text-xl sm:text-2xl" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
