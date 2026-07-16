'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { CmsArticlesAdminPage } from '@/components/admin/cms-articles-admin-page';
import { queryKeys } from '@/lib/query-keys';

export default function AdminBlogArticlesPage() {
  const { messages } = useLocale();

  return (
    <CmsArticlesAdminPage
      kind="blog"
      apiBase="/api/admin/blog-articles"
      queryKey={queryKeys.adminBlogArticles}
      publicPathPrefix="/blog"
      title={messages.admin.blogArticles.title}
      subtitle={messages.admin.blogArticles.subtitle}
    />
  );
}
