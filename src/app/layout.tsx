import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
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
  title: "CashTrade - Vendez vos skins CS2 facilement",
  description: "La plateforme la plus rapide et sécurisée pour convertir vos skins Counter-Strike 2 en argent réel. Paiements SEPA et crypto disponibles.",
  keywords: ["CS2", "Counter-Strike", "skins", "trading", "cashout", "SEPA", "crypto"],
  authors: [{ name: "CashTrade Team" }],
  openGraph: {
    title: "CashTrade - Vendez vos skins CS2 facilement",
    description: "La plateforme la plus rapide et sécurisée pour convertir vos skins Counter-Strike 2 en argent réel.",
    type: "website",
    url: "https://cashtrade.gg",
    siteName: "CashTrade",
  },
  twitter: {
    card: "summary_large_image",
    title: "CashTrade - Vendez vos skins CS2 facilement",
    description: "La plateforme la plus rapide et sécurisée pour convertir vos skins Counter-Strike 2 en argent réel.",
    creator: "@cashtrade",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
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
              <Toaster />
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
