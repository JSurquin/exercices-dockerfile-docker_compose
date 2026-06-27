import { Inter, Poppins, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { RootLayoutShell } from '@/components/layout/root-layout-shell';
import { EMPTY_PUBLIC_STATS, getServerPublicStats } from '@/lib/get-public-stats';
import type { Locale } from '@/lib/i18n';
import {
  LOCALE_COOKIE,
  isValidLocale,
  localeSiteMetadata,
  localeToHtmlLang,
} from '@/lib/locale-detection';

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

const siteUrl = 'https://moonskin.gg';

async function getRequestLocale(): Promise<Locale> {
  const headerStore = await headers();
  const headerLocale = headerStore.get('x-moonskin-locale');
  if (isValidLocale(headerLocale)) {
    return headerLocale;
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;

  if (isValidLocale(cookieLocale)) {
    return cookieLocale;
  }

  return 'en';
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const localized = localeSiteMetadata[locale];

  return {
    title: localized.title,
    description: localized.description,
    keywords: ['CS2', 'Counter-Strike', 'skins', 'trading', 'cashout', 'SEPA', 'crypto'],
    authors: [{ name: 'MoonSkin Team' }],
    alternates: {
      canonical: siteUrl,
      languages: {
        fr: `${siteUrl}/?lang=fr`,
        en: `${siteUrl}/?lang=en`,
        zh: `${siteUrl}/?lang=cn`,
        'x-default': `${siteUrl}/?lang=en`,
      },
    },
    openGraph: {
      title: localized.title,
      description: localized.description,
      type: 'website',
      url: siteUrl,
      siteName: 'MoonSkin',
      locale: localized.openGraphLocale,
      alternateLocale: Object.values(localeSiteMetadata)
        .map((entry) => entry.openGraphLocale)
        .filter((entry) => entry !== localized.openGraphLocale),
    },
    twitter: {
      card: 'summary_large_image',
      title: localized.title,
      description: localized.description,
      creator: '@moonskin',
    },
  };
}

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

  const initialLocale = await getRequestLocale();

  return (
    <html lang={localeToHtmlLang(initialLocale)} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${poppins.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen flex flex-col overflow-x-hidden${
          process.env.NODE_ENV === 'development' ? ' next-dev-overlay-present' : ''
        }`}
      >
        <RootLayoutShell initialPublicStats={initialPublicStats} initialLocale={initialLocale}>
          {children}
        </RootLayoutShell>
      </body>
    </html>
  );
}
