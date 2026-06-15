import { Inter, Poppins, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import { RootLayoutShell } from '@/components/layout/root-layout-shell';
import { EMPTY_PUBLIC_STATS, getServerPublicStats } from '@/lib/get-public-stats';

export const revalidate = 300;
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialPublicStats = EMPTY_PUBLIC_STATS;
  try {
    initialPublicStats = await getServerPublicStats();
  } catch {
    // Keep zeroed fallback; client can still refetch /api/stats.
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${poppins.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen flex flex-col overflow-x-hidden${
          process.env.NODE_ENV === 'development' ? ' next-dev-overlay-present' : ''
        }`}
      >
        <RootLayoutShell initialPublicStats={initialPublicStats}>{children}</RootLayoutShell>
      </body>
    </html>
  );
}
