'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Megaphone, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/providers/locale-provider';
import type { PublicHomePopup } from '@/lib/get-public-home-popups';
import { pickLocalized } from '@/lib/i18n';

const DISMISSED_STORAGE_KEY = 'moonskin-dismissed-home-popups';

function readDismissedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

function persistDismissedIds(ids: Set<string>) {
  localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...ids]));
}

function pickPopupText(popup: PublicHomePopup, locale: string) {
  const title = pickLocalized(locale as 'fr' | 'en' | 'cn', {
    fr: popup.titleFr,
    en: popup.titleEn,
    cn: popup.titleCn ?? popup.titleEn,
  });
  const message = pickLocalized(locale as 'fr' | 'en' | 'cn', {
    fr: popup.messageFr,
    en: popup.messageEn,
    cn: popup.messageCn ?? popup.messageEn,
  });
  const ctaLabel = popup.ctaUrl
    ? pickLocalized(locale as 'fr' | 'en' | 'cn', {
        fr: popup.ctaLabelFr ?? 'En savoir plus',
        en: popup.ctaLabelEn ?? 'Learn more',
        cn: popup.ctaLabelCn ?? popup.ctaLabelEn ?? '了解更多',
      })
    : null;

  return { title, message, ctaLabel };
}

export function HomePopupDisplay() {
  const pathname = usePathname();
  const { locale, messages } = useLocale();
  const t = messages.homePopup;
  const [popups, setPopups] = useState<PublicHomePopup[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const isHomePage = pathname === '/';

  useEffect(() => {
    setDismissedIds(readDismissedIds());
  }, []);

  useEffect(() => {
    if (!isHomePage) return;

    let cancelled = false;
    const loadPopups = async () => {
      try {
        const response = await fetch('/api/home-popups', { cache: 'no-store' });
        if (!response.ok) return;
        const data = (await response.json()) as { popups?: PublicHomePopup[] };
        if (!cancelled) {
          setPopups(data.popups ?? []);
          setCurrentIndex(0);
        }
      } catch {
        // Ignore fetch errors silently
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    void loadPopups();
    return () => {
      cancelled = true;
    };
  }, [isHomePage]);

  const visiblePopups = useMemo(
    () => popups.filter((popup) => !dismissedIds.has(popup.id)),
    [popups, dismissedIds]
  );

  const currentPopup = visiblePopups[currentIndex] ?? null;
  const open = isHomePage && loaded && currentPopup !== null;

  const dismissCurrent = useCallback(() => {
    if (!currentPopup) return;
    const next = new Set(dismissedIds);
    next.add(currentPopup.id);
    setDismissedIds(next);
    persistDismissedIds(next);
    setCurrentIndex(0);
  }, [currentPopup, dismissedIds]);

  const popupText = currentPopup ? pickPopupText(currentPopup, locale) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) dismissCurrent();
      }}
    >
      <DialogContent className="max-w-md border-theme-accent/30 bg-background sm:rounded-2xl">
        {currentPopup && popupText && (
          <>
            <DialogHeader className="space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cta-gradient-br shadow-[0_0_20px_var(--cta-shadow)]">
                <Megaphone className="h-6 w-6 text-primary-foreground" />
              </div>
              <DialogTitle className="text-center text-xl font-bold">
                {popupText.title}
              </DialogTitle>
              <DialogDescription className="whitespace-pre-wrap text-center text-base text-foreground/90">
                {popupText.message}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
              {currentPopup.ctaUrl && popupText.ctaLabel && (
                <Button asChild className="w-full">
                  <Link href={currentPopup.ctaUrl} onClick={dismissCurrent}>
                    {popupText.ctaLabel}
                  </Link>
                </Button>
              )}
              <Button variant="outline" className="w-full" onClick={dismissCurrent}>
                <X className="mr-2 h-4 w-4" />
                {t.close}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
