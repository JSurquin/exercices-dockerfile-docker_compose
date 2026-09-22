import type { Metadata } from 'next';
import { buildBlogListingMetadata } from '@/lib/cms-seo-metadata';
import { getRequestLocale } from '@/lib/get-request-locale';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return buildBlogListingMetadata(locale);
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
