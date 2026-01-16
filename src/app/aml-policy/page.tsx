"use client";

import { DynamicLegalPage } from "@/components/legal/dynamic-legal-page";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";

export default function AmlPolicyPage() {
  const { messages } = useLocale();
  const t = messages.amlPolicy;

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
      slug="aml-policy"
      fallbackContent={fallbackContent}
      icon={ShieldExclamationIcon}
      showWarning={true}
      warningText={t.warning}
    />
  );
}
