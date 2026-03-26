"use client";

import { DynamicLegalPage } from "@/components/legal/dynamic-legal-page";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";

export default function KycPolicyPage() {
  const { messages } = useLocale();
  const t = messages.kycPolicy;
  const sections = t.sections;

  const fallbackSections = [
    { id: "introduction", ...sections.introduction },
    { id: "objectives", ...sections.objectives },
    { id: "whenRequired", ...sections.whenRequired },
    { id: "procedure", ...sections.procedure },
    { id: "refusal", ...sections.refusal },
    { id: "antiFraud", ...sections.antiFraud },
    { id: "dataProtection", ...sections.dataProtection },
    { id: "retention", ...sections.retention },
    { id: "userRights", ...sections.userRights },
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
      slug="kyc-policy"
      fallbackContent={fallbackContent}
      icon={ShieldCheckIcon}
      showWarning={true}
      warningText={t.warningText}
    />
  );
}
