'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { CmsArticlesAdminPage } from '@/components/admin/cms-articles-admin-page';
import { queryKeys } from '@/lib/query-keys';

export default function AdminHelpArticlesPage() {
  const { messages } = useLocale();

  return (
    <CmsArticlesAdminPage
      kind="help"
      apiBase="/api/admin/help-articles"
      queryKey={queryKeys.adminHelpArticles}
      publicPathPrefix="/help"
      title={messages.admin.helpArticles.title}
      subtitle={messages.admin.helpArticles.subtitle}
      suggestedSlugs={[
        { slug: 'scam', label: 'API scam' },
        { slug: 'trade-hold', label: 'Trade hold' },
        { slug: 'kyc', label: 'KYC' },
      ]}
    />
  );
}
