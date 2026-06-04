'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/components/providers/locale-provider';

export default function AdminPage() {
  const router = useRouter();
  const { messages } = useLocale();

  useEffect(() => {
    // Redirection automatique vers le dashboard
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-slate-300">{messages.admin.loading.redirecting}</p>
      </div>
    </div>
  );
}