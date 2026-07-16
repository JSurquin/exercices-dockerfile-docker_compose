'use client';

import { useParams } from 'next/navigation';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { HelpArticleDetailPage } from '@/components/content/help-article-detail-page';

export default function HelpArticlePage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  return (
    <HelpArticleDetailPage
      slug={slug}
      icon={ShieldCheckIcon}
    />
  );
}
