import type { BlogArticleRecord } from '@/lib/blog-articles-server';
import { buildBlogArticleMetadata, buildBlogArticleJsonLd } from '@/lib/cms-seo-metadata';

const reverseTradeArticle: BlogArticleRecord = {
  id: '1',
  slug: 'reverse-trade-steam-cs2',
  titleFr: 'CS2 reverse trade : guide complet Steam',
  titleEn: 'CS2 reverse trade: complete Steam guide',
  titleCn: null,
  summaryFr: 'CS2 reverse trade expliqué pour les vendeurs Counter-Strike 2.',
  summaryEn: 'CS2 reverse trade explained for Counter-Strike 2 sellers.',
  summaryCn: null,
  contentFr: 'Contenu',
  contentEn: 'Content',
  contentCn: null,
  category: 'trading',
  coverImageUrl: '/uploads/cms/example.jpg',
  readTimeMinutes: 7,
  isFeatured: true,
  publishedAt: new Date('2026-07-16T12:00:00Z'),
  updatedAt: new Date('2026-07-16T12:00:00Z'),
};

describe('cms-seo-metadata blog', () => {
  it('inclut CS2 reverse trade dans les keywords', () => {
    const metadata = buildBlogArticleMetadata(reverseTradeArticle, 'en');
    expect(metadata.keywords).toEqual(
      expect.arrayContaining(['CS2 reverse trade', 'reverse trade Steam']),
    );
  });

  it('expose une URL canonique et Open Graph article', () => {
    const metadata = buildBlogArticleMetadata(reverseTradeArticle, 'en');
    expect(metadata.alternates?.canonical).toBe(
      'https://moonskin.gg/blog/reverse-trade-steam-cs2',
    );
    expect(metadata.openGraph).toMatchObject({ type: 'article' });
  });

  it('génère un JSON-LD Article', () => {
    const jsonLd = buildBlogArticleJsonLd(reverseTradeArticle, 'en');
    expect(jsonLd['@type']).toBe('Article');
    expect(jsonLd.headline).toContain('CS2 reverse trade');
  });
});
