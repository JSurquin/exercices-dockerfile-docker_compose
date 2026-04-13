'use client';

import { useCallback } from 'react';
import { toast as sonnerToast } from 'sonner';

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
        return sonnerToast.error(headline || 'Erreur', {
          description: detail,
          duration,
        });
      }

      const message = headline || detail || 'Notification';
      const sub = headline ? detail : undefined;
      return sonnerToast(message, { description: sub, duration });
    },
    []
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
