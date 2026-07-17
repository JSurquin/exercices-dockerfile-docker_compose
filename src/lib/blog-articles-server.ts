import { prisma } from '~/prisma/prisma';

export const BLOG_ARTICLE_SELECT = {
  id: true,
  slug: true,
  titleFr: true,
  titleEn: true,
  titleCn: true,
  summaryFr: true,
  summaryEn: true,
  summaryCn: true,
  contentFr: true,
  contentEn: true,
  contentCn: true,
  category: true,
  coverImageUrl: true,
  readTimeMinutes: true,
  isFeatured: true,
  publishedAt: true,
  updatedAt: true,
} as const;

export type BlogArticleRecord = {
  id: string;
  slug: string;
  titleFr: string;
  titleEn: string;
  titleCn: string | null;
  summaryFr: string | null;
  summaryEn: string | null;
  summaryCn: string | null;
  contentFr: string;
  contentEn: string;
  contentCn: string | null;
  category: string | null;
  coverImageUrl: string | null;
  readTimeMinutes: number;
  isFeatured: boolean;
  publishedAt: Date;
  updatedAt: Date;
};

export async function getPublishedBlogArticleBySlug(
  slug: string,
): Promise<BlogArticleRecord | null> {
  return prisma.blogArticle.findFirst({
    where: { slug, isPublished: true },
    select: BLOG_ARTICLE_SELECT,
  });
}

export async function getPublishedBlogArticleSlugs(): Promise<
  Array<{ slug: string; updatedAt: Date; publishedAt: Date }>
> {
  return prisma.blogArticle.findMany({
    where: { isPublished: true },
    select: { slug: true, updatedAt: true, publishedAt: true },
    orderBy: [{ publishedAt: 'desc' }, { sortOrder: 'asc' }],
  });
}
