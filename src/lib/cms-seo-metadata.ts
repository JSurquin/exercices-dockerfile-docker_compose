import type { Metadata } from 'next';
import type { BlogArticleRecord } from '@/lib/blog-articles-server';
import type { CmsLocale } from '@/lib/cms-localized';
import { pickLocalizedField, pickLocalizedOptionalField } from '@/lib/cms-localized';
import { localeToHrefLang } from '@/lib/locale-detection';
import type { Locale } from '@/lib/i18n';

export const SITE_URL = 'https://moonskin.gg';

const OG_LOCALE_BY_CMS: Record<CmsLocale, string> = {
  fr: 'fr_FR',
  en: 'en_US',
  cn: 'zh_CN',
};

function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function resolveCoverImageUrl(coverImageUrl: string | null | undefined): string | undefined {
  if (!coverImageUrl) return undefined;
  if (coverImageUrl.startsWith('http://') || coverImageUrl.startsWith('https://')) {
    return coverImageUrl;
  }
  return absoluteUrl(coverImageUrl);
}

function buildBlogKeywords(
  article: BlogArticleRecord,
  lang: CmsLocale,
): string[] {
  const title = pickLocalizedField(lang, article.titleFr, article.titleEn, article.titleCn);
  const summary =
    pickLocalizedOptionalField(lang, article.summaryFr, article.summaryEn, article.summaryCn) ?? '';

  const base = ['CS2', 'Counter-Strike 2', 'MoonSkin', 'CS2 skins'];
  const slugTokens = article.slug
    .split('-')
    .filter((token) => token.length > 2 && !['cs2', 'steam', 'the', 'and', 'for'].includes(token));

  const text = `${title} ${summary}`.toLowerCase();
  const contextual: string[] = [];

  if (text.includes('reverse trade') || text.includes('reverse-trade')) {
    contextual.push('CS2 reverse trade', 'reverse trade Steam', 'Steam trade reversal');
  }
  if (text.includes('trade hold')) {
    contextual.push('CS2 trade hold', 'Steam trade hold 7 days');
  }
  if (text.includes('vendre') || text.includes('sell')) {
    contextual.push('sell CS2 skins', 'vendre skins CS2');
  }

  return [...new Set([...contextual, ...slugTokens.map((t) => t.replace(/cs2/i, 'CS2')), ...base])];
}

export function resolveBlogLocaleFromHeaders(
  headerLocale: string | null | undefined,
): CmsLocale {
  if (headerLocale === 'fr' || headerLocale === 'en' || headerLocale === 'cn') {
    return headerLocale;
  }
  return 'en';
}

export function buildBlogArticleMetadata(
  article: BlogArticleRecord,
  lang: CmsLocale,
): Metadata {
  const title = pickLocalizedField(lang, article.titleFr, article.titleEn, article.titleCn);
  const description =
    pickLocalizedOptionalField(lang, article.summaryFr, article.summaryEn, article.summaryCn) ??
    title;
  const canonicalPath = `/blog/${article.slug}`;
  const coverImage = resolveCoverImageUrl(article.coverImageUrl);
  const keywords = buildBlogKeywords(article, lang);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: absoluteUrl(canonicalPath),
      languages: {
        fr: absoluteUrl(`${canonicalPath}?lang=fr`),
        en: absoluteUrl(`${canonicalPath}?lang=en`),
        zh: absoluteUrl(`${canonicalPath}?lang=cn`),
        'x-default': absoluteUrl(`${canonicalPath}?lang=en`),
      },
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: absoluteUrl(canonicalPath),
      siteName: 'MoonSkin',
      locale: OG_LOCALE_BY_CMS[lang],
      alternateLocale: (['fr', 'en', 'cn'] as const)
        .filter((entry) => entry !== lang)
        .map((entry) => OG_LOCALE_BY_CMS[entry]),
      publishedTime: article.publishedAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      ...(coverImage ? { images: [{ url: coverImage, alt: title }] } : {}),
    },
    twitter: {
      card: coverImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(coverImage ? { images: [coverImage] } : {}),
    },
  };
}

export function buildBlogListingMetadata(locale: Locale): Metadata {
  const titles: Record<Locale, string> = {
    fr: 'Blog CS2 — Guides, trading et actualités skins | MoonSkin',
    en: 'CS2 Blog — Guides, trading and skin news | MoonSkin',
    cn: 'CS2 博客 — 指南、交易与皮肤资讯 | MoonSkin',
  };
  const descriptions: Record<Locale, string> = {
    fr: 'Guides CS2, reverse trade Steam, trade hold, vente de skins et conseils sécurité sur le blog MoonSkin.',
    en: 'CS2 guides, Steam reverse trade, trade hold, skin selling tips and security advice on the MoonSkin blog.',
    cn: 'CS2 指南、Steam 反向交易、交易冷却、皮肤出售技巧与 MoonSkin 博客安全建议。',
  };

  return {
    title: titles[locale],
    description: descriptions[locale],
    keywords: [
      'CS2 blog',
      'CS2 reverse trade',
      'sell CS2 skins',
      'Counter-Strike 2 guides',
      'Steam trade hold',
    ],
    alternates: {
      canonical: absoluteUrl('/blog'),
      languages: {
        fr: absoluteUrl('/blog?lang=fr'),
        en: absoluteUrl('/blog?lang=en'),
        zh: absoluteUrl('/blog?lang=cn'),
        'x-default': absoluteUrl('/blog?lang=en'),
      },
    },
    openGraph: {
      title: titles[locale],
      description: descriptions[locale],
      type: 'website',
      url: absoluteUrl('/blog'),
      siteName: 'MoonSkin',
    },
  };
}

export function buildBlogArticleJsonLd(
  article: BlogArticleRecord,
  lang: CmsLocale,
): Record<string, unknown> {
  const title = pickLocalizedField(lang, article.titleFr, article.titleEn, article.titleCn);
  const description =
    pickLocalizedOptionalField(lang, article.summaryFr, article.summaryEn, article.summaryCn) ??
    title;
  const coverImage = resolveCoverImageUrl(article.coverImageUrl);
  const url = absoluteUrl(`/blog/${article.slug}`);

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    datePublished: article.publishedAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    inLanguage: localeToHrefLang(lang),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: {
      '@type': 'Organization',
      name: 'MoonSkin',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'MoonSkin',
      url: SITE_URL,
    },
    ...(coverImage ? { image: [coverImage] } : {}),
    keywords: buildBlogKeywords(article, lang).join(', '),
  };
}
