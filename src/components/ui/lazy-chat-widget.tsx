'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { chatWidgetFabButtonClass } from '@/lib/chat-widget-styles';

const ChatWidget = dynamic(
  () => import('@/components/ui/chat-widget').then((mod) => mod.ChatWidget),
  { ssr: false }
);

const IDLE_LOAD_MS = 4000;

function SupportHeadsetIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M5 12.25a7 7 0 0 1 14 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="3.25" y="12" width="5.25" height="7.75" rx="2.625" fill="currentColor" />
      <rect x="15.5" y="12" width="5.25" height="7.75" rx="2.625" fill="currentColor" />
      <path
        d="M5.25 19.75v1.25c0 .97-.79 1.75-1.75 1.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="3.5" cy="22.75" r="1.15" fill="currentColor" />
    </svg>
  );
}

export function LazyChatWidget() {
  const { messages } = useLocale();
  const [shouldLoad, setShouldLoad] = useState(false);
  const [openOnLoad, setOpenOnLoad] = useState(false);

  useEffect(() => {
    let idleId = 0;
    const timeoutId = window.setTimeout(() => setShouldLoad(true), IDLE_LOAD_MS);
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(() => setShouldLoad(true), { timeout: IDLE_LOAD_MS });
    }
    return () => {
      window.clearTimeout(timeoutId);
      if (idleId && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
    };
  }, []);

  const handlePlaceholderClick = useCallback(() => {
    setOpenOnLoad(true);
    setShouldLoad(true);
  }, []);

  if (!shouldLoad) {
    return (
      <div className="pointer-events-auto absolute bottom-[max(1rem,env(safe-area-inset-bottom,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] z-[99999] sm:bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] sm:right-[max(1.5rem,env(safe-area-inset-right,0px))]">
        <button
          type="button"
          data-testid="chat-fab"
          aria-label={messages.chatWidget.tooltip}
          onClick={handlePlaceholderClick}
          className={chatWidgetFabButtonClass()}
        >
          <SupportHeadsetIcon className="h-7 w-7 text-white" />
        </button>
      </div>
    );
  }

  return <ChatWidget initialOpen={openOnLoad} />;
}
