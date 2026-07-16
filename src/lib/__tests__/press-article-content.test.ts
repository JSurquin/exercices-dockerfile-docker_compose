import {
  isPressCoverageArticle,
  normalizePressArticleContent,
  validatePressArticlePayload,
} from '@/lib/press-article-content';

describe('press-article-content', () => {
  it('detects coverage articles from external URL', () => {
    expect(isPressCoverageArticle('https://example.com/article')).toBe(true);
    expect(isPressCoverageArticle('')).toBe(false);
    expect(isPressCoverageArticle(null)).toBe(false);
  });

  it('builds fallback content for external articles', () => {
    const result = normalizePressArticleContent({
      summaryFr: 'Un article sur MoonSkin',
      summaryEn: 'An article about MoonSkin',
      externalUrl: 'https://example.com/article',
    });

    expect(result.contentFr).toContain('Un article sur MoonSkin');
    expect(result.contentFr).toContain('https://example.com/article');
    expect(result.contentEn).toContain('An article about MoonSkin');
  });

  it('requires media and link for coverage articles', () => {
    expect(
      validatePressArticlePayload({
        slug: 'article-1',
        titleFr: 'Titre',
        titleEn: 'Title',
        externalUrl: 'https://example.com/article',
      }),
    ).toBe('Le nom du média est obligatoire pour une retombée presse');
  });

  it('requires content for press releases', () => {
    expect(
      validatePressArticlePayload({
        slug: 'release-1',
        titleFr: 'Titre',
        titleEn: 'Title',
      }),
    ).toBe('Champs obligatoires manquants: contentFr, contentEn');
  });
});
