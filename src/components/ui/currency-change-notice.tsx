'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLocale } from '@/components/providers/locale-provider';

interface CurrencyChangeNoticeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CurrencyChangeNotice({ open, onOpenChange }: CurrencyChangeNoticeProps) {
  const { messages } = useLocale();
  const copy = messages.currencyNotice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-[400] bg-black/60"
        className="z-[400] gap-0 overflow-hidden border-theme-accent/30 bg-card p-0 text-card-foreground shadow-[0_24px_70px_rgba(0,0,0,0.55)] sm:max-w-[640px] sm:rounded-2xl"
      >
        <div className="space-y-4 p-6 sm:p-7">
          <div className="flex items-center gap-3.5">
            <CurrencyRateIcon />
            <DialogTitle className="text-xl leading-tight font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
              {copy.title}
            </DialogTitle>
          </div>

          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {copy.intro}
          </DialogDescription>

          <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <p className="text-foreground">{copy.result}</p>
            <ul className="list-disc space-y-1.5 pl-5 marker:text-theme-accent">
              <li>{copy.bulletBalance}</li>
              <li>{copy.bulletPrices}</li>
              <li>{copy.bulletRounding}</li>
            </ul>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-theme-accent/30 bg-theme-accent/10 px-4 py-3.5 text-foreground">
            <WarningIcon />
            <p className="text-sm leading-snug font-medium">{copy.warning}</p>
          </div>

          <div className="flex items-center justify-center pt-2">
            <Button
              type="button"
              variant="cta"
              onClick={() => onOpenChange(false)}
              className="h-10 min-w-[7.5rem] px-6"
            >
              {copy.gotIt}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CurrencyRateIcon() {
  return (
    <div
      className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-cta-gradient-br text-primary-foreground shadow-[0_0_18px_var(--cta-shadow)]"
      aria-hidden
    >
      <svg viewBox="0 0 32 32" className="size-7" fill="none">
        <path
          d="M16 6.2a9.8 9.8 0 0 1 8.4 4.8"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M24.6 5.8v5.4h-5.4"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 25.8a9.8 9.8 0 0 1-8.4-4.8"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M7.4 26.2v-5.4h5.4"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 11.4v9.2M13.5 13.2c.45-.65 1.3-1 2.5-1 1.55 0 2.6.75 2.6 1.9 0 1.15-.95 1.75-2.7 2.05l-1.15.2c-1.75.3-2.7.95-2.7 2.1 0 1.15 1.05 1.9 2.6 1.9 1.2 0 2.05-.35 2.5-1"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0 text-theme-accent" aria-hidden>
      <path
        fill="currentColor"
        d="M12 3.1 2.6 20.4h18.8L12 3.1zm0 5.3c.5 0 .9.4.9.9v4.5a.9.9 0 1 1-1.8 0V9.3c0-.5.4-.9.9-.9zm0 9.3a1.05 1.05 0 1 1 0-2.1 1.05 1.05 0 0 1 0 2.1z"
      />
    </svg>
  );
}
