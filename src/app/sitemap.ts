import type { MetadataRoute } from 'next';
import { getPublishedBlogArticleSlugs } from '@/lib/blog-articles-server';
import { SITE_URL } from '@/lib/cms-seo-metadata';

const STATIC_PATHS = [
  '',
  '/blog',
  '/sell',
  '/about',
  '/contact',
  '/help',
  '/press',
  '/giveaways',
  '/affiliation',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '' || path === '/blog' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : path === '/blog' ? 0.9 : 0.7,
  }));

  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const articles = await getPublishedBlogArticleSlugs();
    blogEntries = articles.map((article) => ({
      url: `${SITE_URL}/blog/${article.slug}`,
      lastModified: article.updatedAt ?? article.publishedAt,
      changeFrequency: 'weekly',
      priority: article.slug.includes('reverse-trade') ? 0.85 : 0.75,
    }));
  } catch (error) {
    console.error('sitemap: unable to load blog articles', error);
  }

  return [...staticEntries, ...blogEntries];
}
