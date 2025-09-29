import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ChatWidget } from "@/components/ui/chat-widget";
import { Toaster } from "@/components/ui/sonner";

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

export const metadata: Metadata = {
  title: "CashTrade - Sell your CS2 skins easily",
  description: "The fastest and most secure platform to convert your Counter-Strike 2 skins into real money. SEPA and crypto payments available.",
  keywords: ["CS2", "Counter-Strike", "skins", "trading", "cashout", "SEPA", "crypto"],
  authors: [{ name: "CashTrade Team" }],
  openGraph: {
    title: "CashTrade - Sell your CS2 skins easily",
    description: "The fastest and most secure platform to convert your Counter-Strike 2 skins into real money.",
    type: "website",
    url: "https://cashtrade.gg",
    siteName: "CashTrade",
  },
  twitter: {
    card: "summary_large_image",
    title: "CashTrade - Sell your CS2 skins easily",
    description: "The fastest and most secure platform to convert your Counter-Strike 2 skins into real money.",
    creator: "@cashtrade",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider>
            <AuthProvider>
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
              <ChatWidget />
              <Toaster />
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
