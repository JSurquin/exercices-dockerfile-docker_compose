'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { EyeIcon } from '@heroicons/react/24/outline';

export function TourDemoBanner() {
  const { locale } = useLocale();
  const label =
    locale === 'fr'
      ? '👁️ Aperçu démo — connectez-vous pour accéder à cette page'
      : locale === 'cn'
      ? '👁️ 演示预览 — 登录以访问此页面'
      : '👁️ Demo preview — log in to access this page';

  return (
    <div className="mb-5 flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-300">
      <EyeIcon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </div>
  );
}
