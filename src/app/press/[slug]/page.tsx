'use client';

import { useParams } from 'next/navigation';
import { NewspaperIcon } from '@heroicons/react/24/outline';
import { DynamicCmsArticlePage } from '@/components/content/dynamic-cms-article-page';

export default function PressArticlePage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  return (
    <DynamicCmsArticlePage
      apiPath={`/api/press-articles/${slug}`}
      icon={NewspaperIcon}
    />
  );
}
