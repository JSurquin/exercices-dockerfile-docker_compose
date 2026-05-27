'use client';

import { Inter, Poppins, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { SpaceBackground } from "@/components/ui/space-background";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { TourModeProvider } from "@/components/providers/tour-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ChatWidget } from "@/components/ui/chat-widget";
import { ScrollToTopButton } from "@/components/ui/scroll-to-top-button";
import { Toaster } from "@/components/ui/sonner";
import { PayoutReconciler } from "@/components/payout-reconciler";
import UpdateNotifier from "@/components/update-notifier";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import type { Metadata } from "next";
import { usePathname } from "next/navigation";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

// export const metadata: Metadata = {
//   title: "MoonSkin - Sell your CS2 skins easily",
//   description: "The fastest and most secure platform to convert your Counter-Strike 2 skins into real money. SEPA and crypto payments available.",
//   keywords: ["CS2", "Counter-Strike", "skins", "trading", "cashout", "SEPA", "crypto"],
//   authors: [{ name: "MoonSkin Team" }],
//   openGraph: {
//     title: "MoonSkin - Sell your CS2 skins easily",
//     description: "The fastest and most secure platform to convert your Counter-Strike 2 skins into real money.",
//     type: "website",
//     url: "https://moonskin.gg",
//     siteName: "MoonSkin",
//   },
//   twitter: {
//     card: "summary_large_image",
//     title: "MoonSkin - Sell your CS2 skins easily",
//     description: "The fastest and most secure platform to convert your Counter-Strike 2 skins into real money.",
//     creator: "@moonskin",
//   },
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  
  // Déterminer si on est sur une route admin
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>MoonSkin - Sell your CS2 skins easily</title>
        <meta name="description" content="The fastest and most secure platform to convert your Counter-Strike 2 skins into real money. SEPA and crypto payments available." />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${poppins.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen flex flex-col overflow-x-hidden${
          process.env.NODE_ENV === "development" ? " next-dev-overlay-present" : ""
        }`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="moonskin"
          themes={["moonskin", "light", "cs2"]}
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
                  {!isAdminRoute && <SpaceBackground />}
                  {/* Header, Footer et ChatWidget uniquement pour le site public */}
                  {!isAdminRoute && <Header />}
                  
                  <main className={isAdminRoute ? "" : "flex-1"}>
                    {children}
                  </main>
                  
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
      </body>
    </html>
  );
}
