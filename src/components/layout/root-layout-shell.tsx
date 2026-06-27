'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { CosmicBackground } from '@/components/ui/cosmic-background';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { LocaleProvider } from '@/components/providers/locale-provider';
import type { Locale } from '@/lib/i18n';
import { AuthProvider } from '@/components/providers/auth-provider';
import { CurrencyProvider } from '@/components/providers/currency-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { PublicStatsProvider } from '@/components/providers/public-stats-provider';
import type { PublicStats } from '@/hooks/use-public-stats';
import { TourModeProvider } from '@/components/providers/tour-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { FloatingUiPortal } from '@/components/ui/floating-ui-portal';
import { ScrollToTopButton } from '@/components/ui/scroll-to-top-button';
import { Toaster } from '@/components/ui/sonner';
import { PayoutReconciler } from '@/components/payout-reconciler';
import UpdateNotifier from '@/components/update-notifier';
import { ImpersonationBanner } from '@/components/admin/impersonation-banner';
import { AuthCallbackNotifier } from '@/components/auth/auth-callback-notifier';

const ChatWidget = dynamic(
  () => import('@/components/ui/chat-widget').then((mod) => mod.ChatWidget),
  { ssr: false }
);

export function RootLayoutShell({
  children,
  initialPublicStats,
  initialLocale,
}: {
  children: React.ReactNode;
  initialPublicStats: PublicStats;
  initialLocale: Locale;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="moonskin"
      themes={['moonskin', 'light', 'cs2']}
      enableSystem={false}
      disableTransitionOnChange
      storageKey="moonskin-theme"
    >
      <LocaleProvider initialLocale={initialLocale}>
        <CurrencyProvider>
          <QueryProvider>
            <PublicStatsProvider initialStats={initialPublicStats}>
            <AuthProvider>
              <TourModeProvider>
                <ImpersonationBanner />
                <AuthCallbackNotifier />
                {!isAdminRoute && <CosmicBackground />}
                {!isAdminRoute && <Header />}

                <main className={isAdminRoute ? '' : 'relative z-0 flex-1'}>{children}</main>

                {!isAdminRoute && <Footer publicStats={initialPublicStats} />}
                {!isAdminRoute && (
                  <FloatingUiPortal>
                    <ScrollToTopButton />
                    <ChatWidget />
                  </FloatingUiPortal>
                )}

                <PayoutReconciler />
                <UpdateNotifier />
                <Toaster />
              </TourModeProvider>
            </AuthProvider>
            </PublicStatsProvider>
          </QueryProvider>
        </CurrencyProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
