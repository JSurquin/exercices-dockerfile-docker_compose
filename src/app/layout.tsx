'use client';

import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ChatWidget } from "@/components/ui/chat-widget";
import { Toaster } from "@/components/ui/sonner";
import { PayoutReconciler } from "@/components/payout-reconciler";
import UpdateNotifier from "@/components/update-notifier";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import type { Metadata } from "next";
import { usePathname } from "next/navigation";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
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
        className={`${poppins.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen flex flex-col overflow-x-hidden${
          process.env.NODE_ENV === "development" ? " next-dev-overlay-present" : ""
        }`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider>
            <CurrencyProvider>
              <QueryProvider>
                <AuthProvider>
                  <ImpersonationBanner />
                  {/* Header, Footer et ChatWidget uniquement pour le site public */}
                  {!isAdminRoute && <Header />}
                  
                  <main className={isAdminRoute ? "" : "flex-1"}>
                    {children}
                  </main>
                  
                  {!isAdminRoute && <Footer />}
                  {!isAdminRoute && <ChatWidget />}
                  
                  <PayoutReconciler />
                  <UpdateNotifier />
                  <Toaster />
                </AuthProvider>
              </QueryProvider>
            </CurrencyProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
