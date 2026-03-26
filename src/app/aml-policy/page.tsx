"use client";

import { DynamicLegalPage } from "@/components/legal/dynamic-legal-page";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";

export default function AmlPolicyPage() {
  const { messages } = useLocale();
  const t = messages.amlPolicy;
  const sections = t.sections;

  const fallbackSections = [
    { id: "introduction", ...sections.introduction },
    { id: "commitment", ...sections.commitment },
    { id: "userVerification", ...sections.userVerification },
    { id: "transactionMonitoring", ...sections.transactionMonitoring },
    { id: "suspiciousMeasures", ...sections.suspiciousMeasures },
    { id: "reporting", ...sections.reporting },
    { id: "zeroTolerance", ...sections.zeroTolerance },
    { id: "userResponsibility", ...sections.userResponsibility },
    { id: "dataRetention", ...sections.dataRetention },
    { id: "modifications", ...sections.modifications },
  ];

  const fallbackContent = {
    title: t.title,
    subtitle: t.subtitle,
    content: (
      <div className="space-y-8">
        {fallbackSections.map((section) => (
          <div key={section.id} id={section.id}>
            <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              {section.content.split("\n\n").map((paragraph, pIndex) => (
                <p key={pIndex} className="mb-4 leading-relaxed whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  };

  return (
    <DynamicLegalPage
      slug="aml-policy"
      fallbackContent={fallbackContent}
      icon={ShieldExclamationIcon}
      showWarning={true}
      warningText={t.warningText}
    />
  );
}
