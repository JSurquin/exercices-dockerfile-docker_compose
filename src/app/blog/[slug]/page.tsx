import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getPublishedBlogArticleBySlug } from '@/lib/blog-articles-server';
import {
  buildBlogArticleJsonLd,
  buildBlogArticleMetadata,
  resolveBlogLocaleFromHeaders,
} from '@/lib/cms-seo-metadata';
import { BlogArticlePageClient } from '@/components/content/blog-article-page-client';

interface BlogArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedBlogArticleBySlug(slug);
  if (!article) {
    return { title: 'Article introuvable | MoonSkin' };
  }

  const headerStore = await headers();
  const lang = resolveBlogLocaleFromHeaders(headerStore.get('x-moonskin-locale'));
  return buildBlogArticleMetadata(article, lang);
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const article = await getPublishedBlogArticleBySlug(slug);
  if (!article) {
    notFound();
  }

  const headerStore = await headers();
  const lang = resolveBlogLocaleFromHeaders(headerStore.get('x-moonskin-locale'));
  const jsonLd = buildBlogArticleJsonLd(article, lang);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogArticlePageClient slug={slug} />
    </>
  );
}
