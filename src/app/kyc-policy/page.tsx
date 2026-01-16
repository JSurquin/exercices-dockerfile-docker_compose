"use client";

import { DynamicLegalPage } from "@/components/legal/dynamic-legal-page";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";

export default function KycPolicyPage() {
  const { messages } = useLocale();
  const t = messages.kycPolicy;

  const fallbackContent = {
    title: t.title,
    subtitle: t.subtitle,
    content: (
      <div className="space-y-6 text-muted-foreground">
        <p>{t.comingSoon}</p>
      </div>
    ),
  };

  return (
    <DynamicLegalPage
      slug="kyc-policy"
      fallbackContent={fallbackContent}
      icon={ShieldCheckIcon}
      showWarning={true}
      warningText={t.warning}
    />
  );
}
