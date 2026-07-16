'use client';

import { useParams } from 'next/navigation';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { DynamicCmsArticlePage } from '@/components/content/dynamic-cms-article-page';

export default function HelpArticlePage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  return (
    <DynamicCmsArticlePage
      apiPath={`/api/help-articles/${slug}`}
      icon={ShieldCheckIcon}
    />
  );
}
