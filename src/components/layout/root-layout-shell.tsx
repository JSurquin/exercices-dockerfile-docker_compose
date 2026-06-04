'use client';

import { usePathname } from 'next/navigation';
import { CosmicBackground } from '@/components/ui/cosmic-background';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { LocaleProvider } from '@/components/providers/locale-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { CurrencyProvider } from '@/components/providers/currency-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { TourModeProvider } from '@/components/providers/tour-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ChatWidget } from '@/components/ui/chat-widget';
import { ScrollToTopButton } from '@/components/ui/scroll-to-top-button';
import { Toaster } from '@/components/ui/sonner';
import { PayoutReconciler } from '@/components/payout-reconciler';
import UpdateNotifier from '@/components/update-notifier';
import { ImpersonationBanner } from '@/components/admin/impersonation-banner';

export function RootLayoutShell({ children }: { children: React.ReactNode }) {
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
      <LocaleProvider>
        <CurrencyProvider>
          <QueryProvider>
            <AuthProvider>
              <TourModeProvider>
                <ImpersonationBanner />
                {!isAdminRoute && <CosmicBackground />}
                {!isAdminRoute && <Header />}

                <main className={isAdminRoute ? '' : 'flex-1'}>{children}</main>

                {!isAdminRoute && <Footer />}
                {!isAdminRoute && <ScrollToTopButton />}
                {!isAdminRoute && <ChatWidget />}

                <PayoutReconciler />
                <UpdateNotifier />
                <Toaster />
              </TourModeProvider>
            </AuthProvider>
          </QueryProvider>
        </CurrencyProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
