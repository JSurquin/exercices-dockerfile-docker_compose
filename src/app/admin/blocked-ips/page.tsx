'use client';

import { BlockedIpsManagement } from '@/components/admin/blocked-ips-management';
import { useLocale } from '@/components/providers/locale-provider';

export default function AdminBlockedIpsPage() {
  const { messages } = useLocale();
  const t = messages.admin.blockedIps;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{t.pageTitle}</h1>
        <p className="text-slate-400">{t.pageSubtitle}</p>
      </div>
      <BlockedIpsManagement />
    </div>
  );
}
