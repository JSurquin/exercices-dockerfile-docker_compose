'use client';

import { PageLoading } from '@/components/ui/page-loading';
import { useLocale } from '@/components/providers/locale-provider';

export default function ModerationLoading() {
  const { messages } = useLocale();
  return (
    <PageLoading
      variant="compact"
      message={messages.moderation.loading}
      className="min-h-[50vh]"
    />
  );
}
