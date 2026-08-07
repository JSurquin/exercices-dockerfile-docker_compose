'use client';

import { useLocale } from '@/components/providers/locale-provider';
import type { Locale } from '@/lib/i18n';

const COPY: Record<
  Locale,
  { before: string; cta: string; after: string }
> = {
  fr: {
    before: 'IBAN français ? Passez par ',
    cta: 'SEPA Premium',
    after: ' — frais réduits.',
  },
  en: {
    before: 'French IBAN? Use ',
    cta: 'SEPA Premium',
    after: ' — lower fees.',
  },
  cn: {
    before: '法国 IBAN？请使用 ',
    cta: 'SEPA Premium',
    after: ' — 更低费用。',
  },
};

interface SepaFrPremiumHintProps {
  onSelectSepaPremium: () => void;
}

export function SepaFrPremiumHint({ onSelectSepaPremium }: SepaFrPremiumHintProps) {
  const { locale } = useLocale();
  const copy = COPY[locale] ?? COPY.en;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        {copy.before}
        <button
          type="button"
          onClick={onSelectSepaPremium}
          className="font-medium text-theme-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent/40 rounded-sm"
        >
          {copy.cta}
        </button>
        {copy.after}
      </p>
    </div>
  );
}
