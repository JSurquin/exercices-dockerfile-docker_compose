'use client';

import { useEffect, useState } from 'react';
import { ReviewPrompt } from '@/components/review/review-prompt';
import { formatCentsToCurrency } from '@/lib/currency-converter';

type PromptState = {
  amount?: string;
};

const STORAGE_KEY = 'ms.reviewPrompt';

let inFlight: Promise<PromptState | null> | null = null;

function readStored(): PromptState | null | 'done' | undefined {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw === 'done') return 'done';
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as PromptState & { path?: string };
    if (parsed.path && parsed.path !== window.location.pathname) {
      return null;
    }
    return { amount: parsed.amount };
  } catch {
    return undefined;
  }
}

function persistShown(state: PromptState) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, path: window.location.pathname }),
    );
  } catch {
    // private mode
  }
}

function persistDone() {
  try {
    sessionStorage.setItem(STORAGE_KEY, 'done');
  } catch {
    // private mode
  }
}

function loadPageReviewPrompt(): Promise<PromptState | null> {
  const stored = readStored();
  if (stored === 'done' || stored === null) {
    return Promise.resolve(null);
  }
  if (stored) {
    return Promise.resolve(stored);
  }

  if (!inFlight) {
    inFlight = fetch('/api/user/review-prompt', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as {
          askReview?: boolean;
          amountCents?: number | null;
        };
        if (data?.askReview !== true) return null;
        const amount =
          typeof data.amountCents === 'number'
            ? formatCentsToCurrency(data.amountCents, 'EUR')
            : undefined;
        return { amount };
      })
      .catch(() => null)
      .then((result) => {
        if (result) persistShown(result);
        return result;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

/**
 * Modale Trustpilot au chargement de /dashboard et /payout :
 * un nouveau retrait PAID / FLEXIFY_PAID / WHITEPAY_COMPLETE, sauf si l’avis a déjà été cliqué.
 */
export function ReviewPromptBanner() {
  const [state, setState] = useState<PromptState | null>(null);
  const [asked, setAsked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadPageReviewPrompt().then((next) => {
      if (!cancelled && next) {
        setState(next);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!state || asked) {
    return null;
  }

  return (
    <ReviewPrompt
      trigger="withdrawal"
      amount={state.amount}
      onAsked={() => {
        persistDone();
        window.setTimeout(() => setAsked(true), 320);
      }}
    />
  );
}
