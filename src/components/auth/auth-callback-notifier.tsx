'use client';

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useLocale } from '@/components/providers/locale-provider';

function formatBanExpiry(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const tag = locale === 'en' ? 'en-GB' : locale === 'cn' ? 'zh-CN' : 'fr-FR';
  return date.toLocaleString(tag, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AuthCallbackNotifierInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { locale, messages } = useLocale();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const error = searchParams.get('error');
    if (!error) return;

    handled.current = true;
    toast.dismiss();

    const t = messages.authCallback;
    const reason = searchParams.get('reason')?.trim() || null;
    const expires = searchParams.get('expires');

    let title = t.genericTitle;
    let description = t.genericDescription;

    switch (error) {
      case 'account_banned':
        title = t.accountBannedTitle;
        description = reason
          ? t.accountBannedReason.replace('{reason}', reason)
          : t.accountBannedDescription;
        if (expires) {
          const formatted = formatBanExpiry(expires, locale);
          if (formatted) {
            description = `${description} ${t.accountBannedExpires.replace('{date}', formatted)}`;
          }
        } else {
          description = `${description} ${t.accountBannedPermanent}`;
        }
        break;
      case 'ip_blocked':
        title = t.ipBlockedTitle;
        description = t.ipBlockedDescription;
        break;
      case 'steam_verification_failed':
        title = t.steamVerificationFailedTitle;
        description = t.steamVerificationFailedDescription;
        break;
      case 'steam_profile_fetch_failed':
        title = t.steamProfileFailedTitle;
        description = t.steamProfileFailedDescription;
        break;
      case 'steam_callback_error':
        title = t.steamCallbackErrorTitle;
        description = t.steamCallbackErrorDescription;
        break;
      default:
        break;
    }

    toast.error(title, {
      description,
      duration: error === 'account_banned' || error === 'ip_blocked' ? 12000 : 8000,
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete('error');
    params.delete('reason');
    params.delete('expires');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [locale, messages.authCallback, pathname, router, searchParams]);

  return null;
}

export function AuthCallbackNotifier() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackNotifierInner />
    </Suspense>
  );
}
