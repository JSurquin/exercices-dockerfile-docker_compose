'use client';

import AffiliateApplications from '@/components/admin/affiliate-applications';
import { useLocale } from '@/components/providers/locale-provider';

export default function AffiliateApplicationsPage() {
  const { messages } = useLocale();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        <AffiliateApplications />
      </div>
    </div>
  );
}

