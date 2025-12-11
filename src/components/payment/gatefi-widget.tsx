'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useLocale } from '@/components/providers/locale-provider';

interface GateFiWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  widgetUrl: string;
  payoutId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function GateFiWidget({
  isOpen,
  onClose,
  widgetUrl,
  payoutId,
  onSuccess,
  onError,
}: GateFiWidgetProps) {
  const { messages } = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

    // Écouter les messages du widget GateFi
    const handleMessage = (event: MessageEvent) => {
      // Vérifier l'origine pour la sécurité
      if (!event.origin.includes('gatefi.com')) return;

      const { type, data } = event.data;

      switch (type) {
        case 'PAYMENT_SUCCESS':
          console.log('[GateFi Widget] Payment success:', data);
          onSuccess?.();
          onClose();
          router.push('/dashboard?payment=success');
          break;

        case 'PAYMENT_ERROR':
          console.error('[GateFi Widget] Payment error:', data);
          onError?.(data.message || 'Payment failed');
          onClose();
          break;

        case 'PAYMENT_CANCELLED':
          console.log('[GateFi Widget] Payment cancelled');
          onClose();
          break;

        case 'WIDGET_CLOSED':
          console.log('[GateFi Widget] Widget closed');
          onClose();
          break;

        default:
          console.log('[GateFi Widget] Unknown event:', type, data);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isOpen, onClose, onSuccess, onError, router]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{messages.paymentComponents.gatefiWidget.title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 w-full h-full p-6 pt-0">
          {widgetUrl ? (
            <iframe
              src={widgetUrl}
              className="w-full h-full border-0 rounded-lg"
              title="GateFi Payment Widget"
              allow="payment"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

