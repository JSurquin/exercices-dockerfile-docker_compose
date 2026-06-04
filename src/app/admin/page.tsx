'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/components/providers/locale-provider';
import { PageLoading } from '@/components/ui/page-loading';

export default function AdminPage() {
  const router = useRouter();
  const { messages } = useLocale();

  useEffect(() => {
    // Redirection automatique vers le dashboard
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <PageLoading
      variant="compact"
      message={messages.admin.loading.redirecting}
      className="min-h-[50vh]"
    />
  );
}