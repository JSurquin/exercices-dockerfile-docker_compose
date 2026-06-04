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
    <div className="mb-5 flex items-center gap-2 rounded-lg border border-theme-highlight/40 bg-theme-highlight/10 px-4 py-2.5 text-sm text-theme-highlight">
      <EyeIcon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </div>
  );
}
