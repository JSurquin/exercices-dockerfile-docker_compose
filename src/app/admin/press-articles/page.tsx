'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { CmsArticlesAdminPage } from '@/components/admin/cms-articles-admin-page';
import { queryKeys } from '@/lib/query-keys';

export default function AdminPressArticlesPage() {
  const { messages } = useLocale();

  return (
    <CmsArticlesAdminPage
      kind="press"
      apiBase="/api/admin/press-articles"
      queryKey={queryKeys.adminPressArticles}
      publicPathPrefix="/press"
      title={messages.admin.pressArticles.title}
      subtitle={messages.admin.pressArticles.subtitle}
    />
  );
}
