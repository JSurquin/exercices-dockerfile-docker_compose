'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useLocale } from '@/components/providers/locale-provider';
import { playNotificationSound } from '@/lib/play-notification-sound';

interface UpdateNotifierProps {
  checkInterval?: number;
  initialDelay?: number;
  countdownSeconds?: number;
}

export default function UpdateNotifier({
  checkInterval = 60000,
  initialDelay = 30000,
  countdownSeconds = 5,
}: UpdateNotifierProps) {
  const [currentBuildId, setCurrentBuildId] = useState<string | null>(null);
  const toastIdRef = useRef<string | number | null>(null);
  const hasShownToast = useRef(false);
  const { messages } = useLocale();

  useEffect(() => {
    const fetchInitialBuildId = async () => {
      try {
        const response = await fetch('/api/build-id', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        const data = await response.json();
        setCurrentBuildId(data.buildId);
      } catch {
        // Silently fail on initial fetch
      }
    };

    fetchInitialBuildId();
  }, []);

  useEffect(() => {
    if (!currentBuildId) return;

    const checkForUpdates = async () => {
      try {
        const response = await fetch('/api/build-id', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        const data = await response.json();

        if (data.buildId !== currentBuildId && !hasShownToast.current) {
          hasShownToast.current = true;
          showUpdateToast();
        }
      } catch {
        // Silently fail on check
      }
    };

    const initialTimeout = setTimeout(checkForUpdates, initialDelay);
    const interval = setInterval(checkForUpdates, checkInterval);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [currentBuildId, checkInterval, initialDelay]);

  const showUpdateToast = () => {
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
    }

    let countdown = countdownSeconds;
    const t = messages.updateNotifier;

    const id = toast.info(t.title, {
      description: t.countdown.replace('{seconds}', String(countdown)),
      duration: Infinity,
      onDismiss: () => {
        clearInterval(countdownInterval);
        toastIdRef.current = null;
      },
    });

    toastIdRef.current = id;

    const countdownInterval = setInterval(() => {
      countdown--;

      if (countdown > 0) {
        toast.info(t.title, {
          id,
          description: t.countdown.replace('{seconds}', String(countdown)),
          duration: Infinity,
        });
      } else {
        clearInterval(countdownInterval);
        toast.dismiss(id);
        window.location.reload();
      }
    }, 1000);

    playNotificationSound();
  };

  return null;
}
