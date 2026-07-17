'use client';

import { NewspaperIcon } from '@heroicons/react/24/outline';
import { DynamicCmsArticlePage } from '@/components/content/dynamic-cms-article-page';

interface BlogArticlePageClientProps {
  slug: string;
}

export function BlogArticlePageClient({ slug }: BlogArticlePageClientProps) {
  return (
    <DynamicCmsArticlePage
      apiPath={`/api/blog-articles/${slug}`}
      icon={NewspaperIcon}
    />
  );
}
