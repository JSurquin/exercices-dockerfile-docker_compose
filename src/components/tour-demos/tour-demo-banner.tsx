'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { EyeIcon } from '@heroicons/react/24/outline';

export function TourDemoBanner() {
  const { messages } = useLocale();

  return (
    <div className="mb-5 flex items-center gap-2 rounded-lg border border-theme-highlight/40 bg-theme-highlight/10 px-4 py-2.5 text-sm text-theme-highlight">
      <EyeIcon className="w-4 h-4 shrink-0" />
      <span>{messages.tourDemo.banner}</span>
    </div>
  );
}
