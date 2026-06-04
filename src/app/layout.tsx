import { Inter, Poppins, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import { RootLayoutShell } from '@/components/layout/root-layout-shell';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MoonSkin - Sell your CS2 skins easily',
  description:
    'The fastest and most secure platform to convert your Counter-Strike 2 skins into real money. SEPA and crypto payments available.',
  keywords: ['CS2', 'Counter-Strike', 'skins', 'trading', 'cashout', 'SEPA', 'crypto'],
  authors: [{ name: 'MoonSkin Team' }],
  icons: {
    icon: [
      { url: '/icon.png?v=2', type: 'image/png', sizes: '32x32' },
      { url: '/favicon.ico?v=2', sizes: 'any' },
    ],
    apple: [{ url: '/apple-icon.png?v=2', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico?v=2',
  },
  openGraph: {
    title: 'MoonSkin - Sell your CS2 skins easily',
    description:
      'The fastest and most secure platform to convert your Counter-Strike 2 skins into real money.',
    type: 'website',
    url: 'https://moonskin.gg',
    siteName: 'MoonSkin',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MoonSkin - Sell your CS2 skins easily',
    description:
      'The fastest and most secure platform to convert your Counter-Strike 2 skins into real money.',
    creator: '@moonskin',
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
        className={`${inter.variable} ${spaceGrotesk.variable} ${poppins.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen flex flex-col overflow-x-hidden${
          process.env.NODE_ENV === 'development' ? ' next-dev-overlay-present' : ''
        }`}
      >
        <RootLayoutShell>{children}</RootLayoutShell>
      </body>
    </html>
  );
}
