import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/cms-seo-metadata';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/moderation/', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
