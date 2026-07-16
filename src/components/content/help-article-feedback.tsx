'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/providers/locale-provider';
import { HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface HelpArticleFeedbackProps {
  slug: string;
}

const STORAGE_PREFIX = 'help-feedback-';

export function HelpArticleFeedback({ slug }: HelpArticleFeedbackProps) {
  const { messages } = useLocale();
  const t = messages.helpPage.feedback;
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(`${STORAGE_PREFIX}${slug}`)) {
      setSubmitted(true);
    }
  }, [slug]);

  const submitFeedback = async (helpful: boolean) => {
    if (submitted || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/help-articles/${slug}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful }),
      });
      if (!response.ok) throw new Error('Failed');
      localStorage.setItem(`${STORAGE_PREFIX}${slug}`, helpful ? 'yes' : 'no');
      setSubmitted(true);
      toast.success(t.thankYou);
    } catch {
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-border text-center">
      {submitted ? (
        <p className="text-sm text-muted-foreground">{t.thankYou}</p>
      ) : (
        <>
          <p className="text-sm font-medium mb-4">{t.question}</p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => submitFeedback(true)}
              className="gap-2"
            >
              <HandThumbUpIcon className="w-4 h-4" />
              {t.yes}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => submitFeedback(false)}
              className="gap-2"
            >
              <HandThumbDownIcon className="w-4 h-4" />
              {t.no}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
