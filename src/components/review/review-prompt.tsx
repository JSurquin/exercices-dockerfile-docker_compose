'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useLocale } from '@/components/providers/locale-provider';
import {
  TRUSTPILOT_EVALUATE_URL,
  type ReviewPromptAction,
  type ReviewPromptTrigger,
} from '@/lib/review-prompt';

const APPEAR_DELAY_MS = 1800;

type ReviewPromptProps = {
  trigger: ReviewPromptTrigger;
  amount?: string;
  onAsked: (action: ReviewPromptAction) => void;
};

async function reportReviewPrompt(
  action: ReviewPromptAction,
  trigger: ReviewPromptTrigger,
): Promise<void> {
  try {
    await fetch('/api/user/review-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, trigger }),
    });
  } catch {
    // L'éligibilité est déjà consommée côté serveur (seenAt).
  }
}

export function ReviewPrompt({ trigger, amount, onAsked }: ReviewPromptProps) {
  const { messages } = useLocale();
  const copy = messages.reviewPrompt;
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(true);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), APPEAR_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const settle = (action: ReviewPromptAction) => {
    if (settled) return;
    setSettled(true);
    void reportReviewPrompt(action, trigger);
    onAsked(action);
  };

  const handleDismiss = () => {
    setOpen(false);
    settle('dismissed');
  };

  const title =
    trigger === 'withdrawal'
      ? copy.withdrawalTitle.replace('{montant}', amount ?? '')
      : copy.depositTitle;
  const body = trigger === 'withdrawal' ? copy.withdrawalBody : copy.depositBody;

  return (
    <AnimatePresence>
      {ready && open && (
        <motion.aside
          role="region"
          aria-label={copy.cta}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="relative w-full p-4 pr-11 max-[560px]:p-4"
          style={{
            background: 'rgba(255,255,255,.03)',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 14,
          }}
        >
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute right-3 top-3 rounded-md p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={copy.close}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4 max-[560px]:flex-col max-[560px]:items-stretch">
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-base font-semibold text-white">{title}</p>
              <p className="text-sm leading-relaxed text-white/70">{body}</p>
            </div>
            <a
              href={TRUSTPILOT_EVALUATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => settle('clicked')}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 max-[560px]:w-full"
            >
              {copy.cta}
            </a>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
