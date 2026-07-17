import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { buildBlogListingMetadata } from '@/lib/cms-seo-metadata';
import { LOCALE_COOKIE, isValidLocale } from '@/lib/locale-detection';
import type { Locale } from '@/lib/i18n';

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
  return buildBlogListingMetadata(locale);
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
