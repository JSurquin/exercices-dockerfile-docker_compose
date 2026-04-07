'use client';

import AffiliateApplications from '@/components/admin/affiliate-applications';
import { useLocale } from '@/components/providers/locale-provider';

export default function AffiliateApplicationsPage() {
  const { messages } = useLocale();

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        <AffiliateApplications />
      </div>
    </div>
  );
}

