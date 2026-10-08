'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  TRUSTPILOT_EVALUATE_URL,
  type ReviewPromptAction,
  type ReviewPromptTrigger,
} from '@/lib/review-prompt-shared';

const APPEAR_DELAY_MS = 1500;

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

  if (!copy) {
    return null;
  }

  const settle = (action: ReviewPromptAction) => {
    if (settled) return;
    setSettled(true);
    setOpen(false);
    void reportReviewPrompt(action, trigger);
    onAsked(action);
  };

  const handleDismiss = () => {
    settle('dismissed');
  };

  const title =
    trigger === 'withdrawal'
      ? copy.withdrawalTitle.replace('{montant}', amount ?? '')
      : copy.depositTitle;
  const body = trigger === 'withdrawal' ? copy.withdrawalBody : copy.depositBody;

  return (
    <Dialog
      open={ready && open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleDismiss();
      }}
    >
      <DialogContent
        className="sm:max-w-[480px] text-center overflow-hidden"
        showCloseButton
      >
        <DialogHeader className="items-center text-center sm:text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-full bg-green-500/30"
                animate={{ scale: [1, 1.6, 1], opacity: [0.8, 0, 0.8] }}
                transition={{ duration: 1.8, repeat: 2, ease: 'easeOut' }}
              />
              <CheckCircleIcon className="w-20 h-20 text-green-500 relative z-10" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">
              {title}
            </DialogTitle>
            <p className="text-base font-medium text-foreground">{copy.subtitle}</p>
          </motion.div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <DialogDescription className="text-base text-center leading-relaxed">
            {body}
          </DialogDescription>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-3 pt-2"
          >
            <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white">
              <a
                href={TRUSTPILOT_EVALUATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => settle('clicked')}
              >
                {copy.cta}
              </a>
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={handleDismiss}>
              {copy.later}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
