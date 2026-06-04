'use client';

import { PageLoading } from '@/components/ui/page-loading';
import { useLocale } from '@/components/providers/locale-provider';

export default function DashboardLoading() {
  const { messages } = useLocale();
  return (
    <PageLoading variant="compact" message={messages.common.loading} className="min-h-[50vh]" />
  );
}
