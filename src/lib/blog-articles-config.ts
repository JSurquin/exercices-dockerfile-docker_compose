export const BLOG_CATEGORY_KEYS = ['guides', 'trading', 'skins', 'news'] as const;

export type BlogCategoryKey = (typeof BLOG_CATEGORY_KEYS)[number];

export function isBlogCategoryKey(value: string | null | undefined): value is BlogCategoryKey {
  return Boolean(value && BLOG_CATEGORY_KEYS.includes(value as BlogCategoryKey));
}
