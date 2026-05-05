'use client';

import { useCallback } from 'react';
import { toast as sonnerToast } from 'sonner';
import { useLocale } from '@/components/providers/locale-provider';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

/**
 * Délègue à Sonner (Toaster monté dans le layout) — l’ancienne implémentation
 * mettait les toasts en mémoire sans aucun rendu UI.
 */
export function useToast() {
  const { messages } = useLocale();

  const toast = useCallback(
    ({
      title,
      description,
      variant = 'default',
      duration = 5000,
    }: Omit<Toast, 'id'>) => {
      const headline = title?.trim();
      const detail = description?.trim();

      if (variant === 'destructive') {
        return sonnerToast.error(headline || messages.common.error, {
          description: detail,
          duration,
        });
      }

      const message = headline || detail || messages.common.success;
      const sub = headline ? detail : undefined;
      return sonnerToast(message, { description: sub, duration });
    },
    [messages]
  );

  const dismiss = useCallback((id?: string | number) => {
    sonnerToast.dismiss(id);
  }, []);

  return {
    toast,
    dismiss,
    toasts: [] as Toast[],
  };
}
